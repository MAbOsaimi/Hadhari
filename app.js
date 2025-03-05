import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";

const removeDiacritics = (text) => text.replace(/[\u064B-\u065F]/g, "");

const convertArabicNumbers = (text) => {
  const arabicNumbers = "٠١٢٣٤٥٦٧٨٩";
  const standardNumbers = "0123456789";
  return text.replace(
    /[٠-٩]/g,
    (d) => standardNumbers[arabicNumbers.indexOf(d)]
  );
};

const preprocessMessage = (message) => {
  message = message.normalize("NFKC");
  message = message.replace(/ـ+/g, "");
  message = message.replace(/(\S)\1{2,}/g, "$1$1");
  message = message.replace(/(?<!\d)\.(?!\d)/g, "");
  message = message.replace(/\s+/g, " ").trim();

  message = removeDiacritics(message);
  message = convertArabicNumbers(message);
  return message;
};

const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      console.log("Connection closed. Reconnecting...");
      connectToWhatsApp();
    } else if (connection === "open") {
      console.log("WhatsApp Web Connected!");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]; // Received message

    if (!msg.message || msg.message.protocolMessage || msg.key.fromMe) {
      // Skip irrelevant messages
      return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split("@")[0];

    const messageText =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    const preprocessedMessage = preprocessMessage(messageText);
    // Skip media-only messages
    if (preprocessedMessage.length === 0) {
      return;
    }

    console.log(
      `Received message from ${senderNumber}: ${preprocessedMessage}`
    );
    fetch(process.env.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: preprocessedMessage,
        sender_number: senderNumber,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
};

connectToWhatsApp();
