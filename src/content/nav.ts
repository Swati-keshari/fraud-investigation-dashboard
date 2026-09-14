export type NavItem = {
  href: string;
  label: string;
  plain: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Start",
    items: [
      { href: "/", label: "How it works", plain: "A picture of the whole job." },
      { href: "/live", label: "Live watch", plain: "New alerts arriving right now." },
    ],
  },
  {
    title: "Daily work",
    items: [
      { href: "/alerts", label: "Alert queue", plain: "Suspicious payments waiting for a human." },
      { href: "/cases", label: "Cases", plain: "Alerts that became investigations." },
      { href: "/evidence", label: "Evidence", plain: "Clues that explain why something looks odd." },
      { href: "/customers", label: "Customers", plain: "People who own the accounts." },
      { href: "/transactions", label: "Payments", plain: "Money moving from A to B." },
    ],
  },
  {
    title: "Decisions",
    items: [
      { href: "/rules", label: "Rules", plain: "If this, then warn the team." },
      { href: "/watchlist", label: "Watchlist", plain: "People or shops we watch extra closely." },
      { href: "/playbook", label: "Playbook", plain: "Step-by-step what to do." },
      { href: "/test", label: "Practice lab", plain: "Try fake payments and see the score." },
    ],
  },
  {
    title: "Learn",
    items: [
      { href: "/learn", label: "Classroom", plain: "Fraud in school-simple words." },
      { href: "/learn/risk", label: "Risk scores", plain: "Why a number is 12 vs 91." },
      { href: "/learn/glossary", label: "Word list", plain: "What each label means." },
      { href: "/reports", label: "Reports", plain: "What happened this week." },
      { href: "/analytics", label: "Charts", plain: "Patterns across many alerts." },
    ],
  },
  {
    title: "Office",
    items: [
      { href: "/audit", label: "Who did what", plain: "A diary of every decision." },
      { href: "/notifications", label: "Notifications", plain: "Pings when something urgent lands." },
      { href: "/team", label: "Team", plain: "Who is on shift." },
      { href: "/settings", label: "Settings", plain: "How the desk is set up." },
      { href: "/help", label: "Help", plain: "Stuck? Start here." },
      { href: "/about", label: "About", plain: "This is Swati Keshari’s project." },
    ],
  },
];

export const ALL_PAGES = NAV_GROUPS.flatMap((g) => g.items);
