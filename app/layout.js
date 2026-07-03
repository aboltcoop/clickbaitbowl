import "./globals.css";

export const metadata = {
  title: "The 2026 World Cup Click Bait Bowl!!!",
  description: "Live leaderboard for the $15 World Cup fantasy pool. W3 · D1 · L0.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
