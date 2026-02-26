import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';
import * as timeago from 'timeago.js';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/context/AuthContext';
import { Message, type Notification } from '../../app/props/listing';
import { MessageService } from '../../app/lib/database/MessageService';
import { dbLogger } from '../../app/lib/database/utils';

type NotificationsProps = {
  buttonClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
};

const mergeClasses = (...classes: Array<string | undefined | null>) =>
  classes.filter(Boolean).join(' ');

const Notifications = ({ buttonClassName, iconClassName, badgeClassName }: NotificationsProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch unread messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:user_settings!sender_id(display_name)')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Format notifications with proper user names
      const notifications = (messages || []).map(msg => ({
        id: msg.id,
        sender_name: msg.sender?.display_name || 'Unknown User',
        content: msg.content,
        created_at: msg.created_at,
        read: msg.is_read,
      }));

      setNotifications(notifications);
      setUnreadCount(notifications.length);
    } catch (error) {
      dbLogger.error('Error fetching notifications', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Subscribe to messages using the new service layer
    const messageSubscription = MessageService.subscribeToMessages(
      user.id,
      (message: Message) => {
        if (message.receiver_id === user.id) {
          handleNewMessage(message);
        } else if (message.is_read && message.receiver_id === user.id) {
          // Remove the notification if message is marked as read
          setNotifications(prev => 
            prev.filter(n => n.id !== message.id)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      },
      (error) => {
        dbLogger.error('Notification subscription error', error);
      }
    );

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user?.id, fetchNotifications]);

  const handleNewMessage = async (message: Message) => {
    try {
      // Get sender display name from user_settings
      const { data: senderData } = await supabase
        .from('user_settings')
        .select('display_name')
        .eq('id', message.sender_id)
        .single();

      const senderName = senderData?.display_name || 'Unknown User';
      
      const newNotification = {
        id: message.id,
        sender_name: senderName,
        content: message.content,
        created_at: message.created_at,
        read: false,
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      setUnreadCount(prev => prev + 1);

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${newNotification.sender_name}: ${newNotification.content}`,
        });
      }
    } catch (error) {
      dbLogger.error('Error handling new message', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Get sender ID by display name (this is a simplified approach - ideally we'd store sender ID)
      const { data: senderData } = await supabase
        .from('user_settings')
        .select('id')
        .eq('display_name', notification.sender_name)
        .single();

      if (!senderData || !user?.id) return;

      // Get all unread messages from this sender
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', senderData.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (messages && messages.length > 0) {
        // Mark all messages from this sender as read using the service
        const success = await MessageService.markMessagesAsRead(
          messages.map(msg => msg.id)
        );

        if (success) {
          // Update local state - remove all notifications from this sender
          setNotifications(prev => 
            prev.filter(n => n.sender_name !== notification.sender_name)
          );
          setUnreadCount(prev => Math.max(0, prev - messages.length));
        }
      }

      // Navigate to messages
      router.push('/messages');
      setShowDropdown(false);
    } catch (error) {
      dbLogger.error('Error marking notifications as read', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={mergeClasses(
          "relative inline-flex items-center justify-center rounded-full transition-colors",
          buttonClassName ?? "p-2 text-white/90 hover:text-white hover:bg-white/10"
        )}
        aria-label="Notifications"
      >
        <Bell
          size={18}
          className={mergeClasses("transition-colors text-current", iconClassName)}
        />
        {unreadCount > 0 && (
          <span
            className={mergeClasses(
              "absolute -top-1 -right-1 bg-[#bf5700] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full",
              badgeClassName
            )}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => { handleNotificationClick(notification); setShowDropdown(false); }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                    !notification.read ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {notification.sender_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notification.sender_name}
                      </p>
                      <p className="text-sm text-gray-500">{notification.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeago.format(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 
