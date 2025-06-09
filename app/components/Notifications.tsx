import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import * as timeago from 'timeago.js';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Message, type Notification } from '../props/listing';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.email) return;

    fetchNotifications();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.email}`,
        },
        (payload) => {
          handleNewMessage(payload.new);
        }
      )
      .subscribe();

    // Subscribe to message updates (for read status)
    const updateSubscription = supabase
      .channel('message_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.email}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          if (updatedMessage.read) {
            // Remove the notification if message is marked as read
            setNotifications(prev => 
              prev.filter(n => n.id !== updatedMessage.id)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.email) return;

    try {
      // Fetch messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.email)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Format notifications using email usernames
      const notifications = (messages || []).map(msg => ({
        id: msg.id,
        sender_name: msg.sender_id.split('@')[0],
        content: msg.content,
        created_at: msg.created_at,
        read: msg.read,
      }));

      setNotifications(notifications);
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNewMessage = async (message: any) => {
    try {
      const newNotification = {
        id: message.id,
        sender_name: message.sender_id.split('@')[0],
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
      console.error('Error handling new message:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Get all unread messages from this sender
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', notification.sender_name + '@utexas.edu')
        .eq('receiver_id', user?.email)
        .eq('read', false);

      if (messages && messages.length > 0) {
        // Mark all messages from this sender as read
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', messages.map(msg => msg.id));

        // Update local state - remove all notifications from this sender
        setNotifications(prev => 
          prev.filter(n => n.sender_name !== notification.sender_name)
        );
        setUnreadCount(prev => Math.max(0, prev - messages.length));
      }

      // Navigate to messages
      router.push('/messages');
      setShowDropdown(false);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
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
        className="relative p-2 rounded-full transition-all duration-300 group"
      >
        <Bell size={20} className="text-white relative z-10 group-hover:text-white transition-colors duration-300" />
        <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-[#bf5700] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
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