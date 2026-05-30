import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaEnvelopeOpenText,
  FaSearch,
  FaSync,
  FaTrash,
  FaCheckCircle,
  FaRegEnvelope,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_BASE_URL;

const ReceivedMessage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/contact-messages`, { withCredentials: true });
      if (data.success) {
        setMessages(data.data || []);
      } else {
        toast.error(data.message || "Failed to fetch messages");
      }
    } catch (error) {
      console.error("Failed to fetch contact messages:", error);
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return messages;

    return messages.filter((message) => [
      message.firstName,
      message.lastName,
      message.email,
      message.phone,
      message.subject,
      message.message,
      message.status,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [messages, search]);

  const unreadCount = messages.filter((message) => message.status !== "Read").length;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const markAsRead = async (message) => {
    const nextStatus = message.status === "Read" ? "Unread" : "Read";
    try {
      const { data } = await axios.patch(
        `${API}/contact-messages/${message.id}`,
        { status: nextStatus },
        { withCredentials: true },
      );

      if (data.success) {
        setMessages((current) => current.map((item) => (
          item.id === message.id ? data.data : item
        )));
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update message status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const deleteMessage = async (message) => {
    toast((t) => (
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-950">Delete message?</p>
          <p className="text-xs text-emerald-600">{message.subject}</p>
        </div>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            const toastId = toast.loading("Deleting message...");
            try {
              await axios.delete(`${API}/contact-messages/${message.id}`, { withCredentials: true });
              setMessages((current) => current.filter((item) => item.id !== message.id));
              toast.success("Message deleted", { id: toastId });
            } catch (error) {
              console.error("Failed to delete message:", error);
              toast.error(error.response?.data?.message || "Failed to delete message", { id: toastId });
            }
          }}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    ), { position: "top-center" });
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-emerald-950">Received Message</h1>
          <p className="mt-2 text-emerald-600">Messages submitted from the contact form.</p>
          <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">Total</p>
            <p className="text-2xl font-bold text-emerald-950">{messages.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">Unread</p>
            <p className="text-2xl font-bold text-emerald-950">{unreadCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3.5 top-3.5 text-emerald-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 pl-10 pr-4 text-sm text-emerald-950 outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={fetchMessages}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            Reload
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-emerald-100 bg-emerald-50">
              <tr>
                {["#", "Sender", "Subject", "Message", "Status", "Received", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-emerald-600">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-emerald-500">
                    <FaSync className="mx-auto mb-3 animate-spin text-2xl" />
                    Fetching messages...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-emerald-500">
                    No received messages found.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message, index) => (
                  <tr key={message.id} className="transition hover:bg-emerald-50/60">
                    <td className="px-5 py-4 font-bold text-emerald-600">{index + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-emerald-950">
                        {[message.firstName, message.lastName].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-xs text-emerald-500">{message.email}</p>
                      {message.phone && <p className="text-xs text-emerald-400">{message.phone}</p>}
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-900">{message.subject}</td>
                    <td className="px-5 py-4">
                      <p className="max-w-md whitespace-pre-wrap text-emerald-700">{message.message}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${message.status === "Read"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {message.status === "Read" ? <FaCheckCircle /> : <FaRegEnvelope />}
                        {message.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-emerald-700">{formatDate(message.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markAsRead(message)}
                          className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                          title={message.status === "Read" ? "Mark unread" : "Mark read"}
                        >
                          <FaEnvelopeOpenText />
                        </button>
                        <button
                          onClick={() => deleteMessage(message)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="Delete message"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceivedMessage;
