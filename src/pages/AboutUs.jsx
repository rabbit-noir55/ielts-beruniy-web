const AboutUs = ({ theme }) => {
  const isDark = theme === "dark";
  return (
    <div className={`p-6 ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
      <h1 className="text-2xl font-bold mb-4">{"About Us"}</h1>
      <p className="text-black/40 dark:text-white/40">
        {"Information about IELTS Beruniy — coming soon."}
      </p>
    </div>
  );
};

export default AboutUs;
