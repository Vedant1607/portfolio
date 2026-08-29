export type JourneyMilestone = {
  number: string;
  stage: string;
  status:
    | "Failure"
    | "Rebuild"
    | "Milestone"
    | "Shift"
    | "Abandoned"
    | "Progression"
    | "Specialization"
    | "Current mission";
  title: string;
  description: string;
  side: "left" | "right";
  featured?: boolean;
  emphasis?: "first-build" | "turning-point";
  current?: boolean;
};

export const journeyMilestones: JourneyMilestone[] = [
  {
    number: "01",
    stage: "First semester",
    status: "Failure",
    title: "Started with C, then lost focus",
    description:
      "I began learning C in my first year of college, but distractions took over and I failed the programming subject.",
    side: "left",
  },
  {
    number: "02",
    stage: "Second semester and beyond",
    status: "Rebuild",
    title: "Cleared the backlog and kept learning",
    description:
      "I learned Python while clearing my C backlog, then continued with Python for several semesters while looking for the direction that felt right.",
    side: "right",
  },
  {
    number: "03",
    stage: "First meaningful build",
    status: "Milestone",
    title: "Built a Todo app in the terminal",
    description:
      "I built a Todo application entirely in the terminal by reading official documentation—without AI chatbots, forums, or copied solutions. It was the first time I thought: I actually built this.",
    side: "left",
    featured: true,
    emphasis: "first-build",
  },
  {
    number: "04",
    stage: "Finding a direction",
    status: "Shift",
    title: "Moved into full-stack development",
    description:
      "Full-stack development became the area I was most interested in, so I changed direction and started building there.",
    side: "right",
  },
  {
    number: "05",
    stage: "An ambitious attempt",
    status: "Abandoned",
    title: "CredVault exposed the real work",
    description:
      "CredVault was an attempt to authorize official documents, generate a hash, and associate it with a Solana wallet so documents could be verified without repeatedly uploading the original. I did not finish it on time and eventually abandoned it. The work sharpened my thinking about scope, architecture, execution speed, and finishing ambitious projects.",
    side: "left",
    featured: true,
    emphasis: "turning-point",
  },
  {
    number: "06",
    stage: "Continued practice",
    status: "Progression",
    title: "Kept showing up to build",
    description:
      "I took part in multiple hackathons without winning and continued experimenting with projects and new technologies.",
    side: "right",
  },
  {
    number: "07",
    stage: "Current direction",
    status: "Specialization",
    title: "Leaning into systems and DeFi",
    description:
      "My focus is increasingly on backend, blockchain, cloud, and DevOps. DeFi is a particular area of interest as I work toward becoming a blockchain engineer.",
    side: "left",
  },
  {
    number: "08",
    stage: "Current unfinished mission",
    status: "Current mission",
    title: "Keep building toward the opportunity",
    description:
      "I am still learning, building, and working toward the opportunity to contribute professionally as an engineer.",
    side: "right",
    current: true,
  },
];
