import { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, ShieldX, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';
import * as timeago from 'timeago.js';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/context/AuthContext';
import { Message, type Notification } from '../../app/props/listing';
import { MessageService } from '../../app/lib/database/MessageService';
import { type AppNotification } from '../../app/lib/database/NotificationService';
import { dbLogger } from '../../app/lib/database/utils';

const SYSTEM_NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  warning:       <ShieldAlert size={16} className="text-yellow-600" />,
  temp_suspension: <ShieldX size={16} className="text-orange-600" />,
  permanent_ban: <ShieldX size={16} className="text-red-600" />,
  action_taken:  <ShieldCheck size={16} className="text-green-600" />,
  report_received: <Info size={16} className="text-blue-600" />,
};

const SYSTEM_NOTIFICATION_BG: Record<string, string> = {
  warning:         'bg-yellow-50',
  temp_suspension: 'bg-orange-50',
  permanent_ban:   'bg-red-50',
  action_taken:    'bg-green-50',
  report_received: 'bg-blue-50',
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<AppNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount =
    notifications.filter(n => !n.read).length +
    systemNotifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();
    fetchSystemNotifications();

    // Subscribe to new messages
    const messageSubscription = MessageService.subscribeToMessages(
      user.id,
      (message: Message) => {
        if (message.receiver_id === user.id) {
          handleNewMessage(message);
        } else if (message.is_read && message.receiver_id === user.id) {
          setNotifications(prev => prev.filter(n => n.id !== message.id));
        }
      },
      (error) => {
        dbLogger.error('Notification subscription error', error);
      }
    );

    // Subscribe to system notifications in real-time
    const systemSubscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setSystemNotifications(prev => [newNotif, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      supabase.removeChannel(systemSubscription);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:user_settings!sender_id(display_name)')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setNotifications(
        (messages || []).map(msg => ({
          id: msg.id,
          sender_name: msg.sender?.display_name || 'Unknown User',
          content: msg.content,
          created_at: msg.created_at,
          read: msg.is_read,
        }))
      );
    } catch (error) {
      dbLogger.error('Error fetching notifications', error);
    }
  };

  const fetchSystemNotifications = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSystemNotifications(data || []);
    } catch (error) {
      dbLogger.error('Error fetching system notifications', error);
    }
  };

  const handleNewMessage = async (message: Message) => {
    try {
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

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${newNotification.sender_name}: ${newNotification.content}`,
        });
      }
    } catch (error) {
      dbLogger.error('Error handling new message', error);
    }
  };

  const handleMessageClick = async (notification: Notification) => {
    try {
      const { data: senderData } = await supabase
        .from('user_settings')
        .select('id')
        .eq('display_name', notification.sender_name)
        .single();

      if (!senderData || !user?.id) return;

      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', senderData.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (messages && messages.length > 0) {
        const success = await MessageService.markMessagesAsRead(
          messages.map(msg => msg.id)
        );
        if (success) {
          setNotifications(prev =>
            prev.filter(n => n.sender_name !== notification.sender_name)
          );
        }
      }

      router.push('/messages');
      setShowDropdown(false);
    } catch (error) {
      dbLogger.error('Error marking notifications as read', error);
    }
  };

  const handleSystemNotificationClick = async (notif: AppNotification) => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)
        .eq('user_id', user.id);

      setSystemNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      dbLogger.error('Error marking system notification as read', error);
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const hasAny = notifications.length > 0 || systemNotifications.length > 0;

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
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {hasAny ? (
              <>
                {/* System notifications (admin actions) */}
                {systemNotifications.map(notif => (
                  <div
                    key={`sys-${notif.id}`}
                    onClick={() => handleSystemNotificationClick(notif)}
                    className={`p-4 border-b cursor-pointer hover:brightness-95 transition ${
                      !notif.is_read
                        ? (SYSTEM_NOTIFICATION_BG[notif.type] ?? 'bg-gray-50')
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {SYSTEM_NOTIFICATION_ICONS[notif.type] ?? <AlertTriangle size={16} className="text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeago.format(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#bf5700] flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Message notifications */}
                {notifications.map(notification => (
                  <div
                    key={`msg-${notification.id}`}
                    onClick={() => { handleMessageClick(notification); setShowDropdown(false); }}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                      !notification.read ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                        {notification.sender_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.sender_name}</p>
                        <p className="text-sm text-gray-500 truncate">{notification.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeago.format(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
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
