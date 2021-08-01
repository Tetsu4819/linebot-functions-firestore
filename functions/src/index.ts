import * as functions from "firebase-functions";
import {
  // Client,
  SignatureValidationFailed,
  TextMessage,
  validateSignature,
  WebhookEvent,
} from "@line/bot-sdk";

import * as admin from "firebase-admin";
admin.initializeApp();
const db: FirebaseFirestore.Firestore = admin.firestore();

// const client: Client = new Client({
//   channelAccessToken: functions.config().line.channel_access_token,
//   channelSecret: functions.config().line.channel_secret,
// });

export const lineWebhook = functions
  .region("asia-northeast1")
  .https.onRequest(async (request, response) => {
    const signature = request.get("x-line-signature");
    const channelSecret = functions.config().line.channel_secret;

    if (
      !signature ||
      !validateSignature(request.rawBody, channelSecret, signature)
    ) {
      throw new SignatureValidationFailed(
        "signature validation failed",
        signature
      );
    }

    Promise.all(request.body.events.map(lineEventHandler))
      .then((result) => response.json(result))
      .catch((error) => console.error(error));
  });

const lineEventHandler = (event: WebhookEvent) => {
  if (event.type !== "message") {
    console.log("event type is not message");
    return Promise.resolve(null);
  }
  try {
    if (event.message.type === "text") {
      const message: TextMessage = {
        type: "text",
        text: event.message.text,
      };
      //write to firestore
      db.collection("messages").add(message);

      // reply
      // const reply: TextMessage = {
      //   type: "text",
      //   text: "send message!",
      // };
      // return client.replyMessage(event.replyToken, reply);
      return;
    } else {
      return Promise.resolve(null);
    }
  } catch (error) {
    console.error(JSON.stringify(error));
    return Promise.resolve(null);
  }
};
