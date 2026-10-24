export type Channel = "email" | "whatsapp";

export type OutboundMessage = {
  channel: Channel;
  to: string;
  body: string;
  status: "draft" | "approved" | "sent";
};

export type SendResult = { sent: false; reason: string };

/** Sends nothing. A later email or WhatsApp adapter can replace one entry. */
export type ChannelSender = {
  id: Channel;
  send: (message: OutboundMessage) => Promise<SendResult>;
};

function unconfigured(id: Channel, reason: string): ChannelSender {
  return { id, async send() { return { sent: false, reason }; } };
}

export const channelSenders: Record<Channel, ChannelSender> = {
  email: unconfigured("email", "email sender is not connected"),
  whatsapp: unconfigured("whatsapp", "whatsapp sender is not connected"),
};
