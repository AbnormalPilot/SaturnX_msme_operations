import { Linking } from "react-native";

export const sendWhatsAppReminder = (
  name: string,
  phone: string,
  amount: number,
  shopName: string,
) => {
  const message = `Hello ${name}, your pending balance at ${shopName} is ₹${amount}. Please pay at your convenience. Thank you!`;
  const url = `whatsapp://send?phone=${phone.includes("+") ? phone : "+91" + phone}&text=${encodeURIComponent(message)}`;

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      alert("WhatsApp is not installed on this device.");
    }
  });
};
