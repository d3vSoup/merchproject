// src/pages/Resell/ResellChat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { supabase, addMessageToChat, closeChat, createTicket } from "../../supabase/client";
import toast from "react-hot-toast";

export default function ResellChat() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let subscription;
    if (chatId && supabase) {
      loadChat();
      subscription = subscribeToChat();
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [chatId]);

  async function loadChat() {
    const { data, error } = await supabase
      .from('resell_chats')
      .select('*, item:resell_items(*), buyer:users!resell_chats_buyer_id_fkey(*), seller:users!resell_chats_seller_id_fkey(*)')
      .eq('id', chatId)
      .single();

    if (error) {
      toast.error("Failed to load chat");
      return;
    }

    setChat(data);
    setMessages(data.messages || []);
  }

  function subscribeToChat() {
    return supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'resell_chats',
        filter: `id=eq.${chatId}`
      }, (payload) => {
        setMessages(payload.new.messages || []);
      })
      .subscribe();
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;

    const message = {
      sender: user.email,
      text: newMessage.trim(),
    };

    const result = await addMessageToChat(chatId, message);
    if (result) {
      setNewMessage("");
    } else {
      toast.error("Failed to send message");
    }
  }

  async function handleCloseChat(success) {
    if (!user?.email) return;

    setClosing(true);
    let reason = null;

    if (!success) {
      reason = prompt("Reason for cancellation:");
      if (!reason) {
        setClosing(false);
        return;
      }

      // Create ticket - need to get user IDs
      const { getUserIdByEmail } = await import("../../supabase/client");
      const reportedUserId = await getUserIdByEmail(user.email);
      const otherUserId = user.email === chat.buyer.email ? chat.seller_id : chat.buyer_id;
      if (reportedUserId && otherUserId) {
        await createTicket({
          userReported: reportedUserId,
          userAccused: otherUserId,
          itemId: chat.item_id,
          reason: reason,
        });
      }
    }

    const result = await closeChat(chatId, success, reason);
    if (result) {
      toast.success(success ? "Deal completed!" : "Chat closed");
      navigate("/resell");
    } else {
      toast.error("Failed to close chat");
    }
    setClosing(false);
  }

  if (!chat) {
    return <div className="loading-skeleton">Loading chat...</div>;
  }

  const isBuyer = user?.email === chat.buyer.email;
  const otherUser = isBuyer ? chat.seller : chat.buyer;

  return (
    <div className="resell-chat">
      <div className="chat-header">
        <button className="btn btn--ghost" onClick={() => navigate("/resell")}>
          ← Back
        </button>
        <div className="chat-user-info">
          <h3>{otherUser.name || otherUser.email}</h3>
          <p>{chat.item.title}</p>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === user?.email ? "own" : "other"}`}
          >
            <div className="message-content">{msg.text}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {chat.is_active && (
        <>
          <form onSubmit={handleSendMessage} className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={closing}
            />
            <button type="submit" className="btn btn--primary" disabled={closing}>
              Send
            </button>
          </form>

          <div className="chat-actions">
            <button
              className="btn btn--primary"
              onClick={() => handleCloseChat(true)}
              disabled={closing}
            >
              Mark as Successful
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => handleCloseChat(false)}
              disabled={closing}
            >
              Cancel Deal
            </button>
          </div>
        </>
      )}

      {!chat.is_active && (
        <div className="chat-closed">
          <p>This chat is closed.</p>
          {chat.success ? (
            <p className="success">Deal was successful!</p>
          ) : (
            <p className="cancelled">Deal was cancelled: {chat.closed_reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

