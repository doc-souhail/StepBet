import Placeholder from "../components/Placeholder";

export default function Dashboard() {
  return (
    <Placeholder
      title="Dashboard"
      subtitle="Your competitions will appear here."
      links={[
        { label: "Create a competition", href: "/create" },
        { label: "Open demo competition", href: "/competition/demo" },
        { label: "Profile", href: "/profile" },
      ]}
    />
  );
}
