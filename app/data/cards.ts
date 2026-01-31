import { MetricCardData } from "../components/MetricCard";

export const AI_RESPONSE =
  "Sure. Here is a Typescript code block for your Analog Clock project. It is built using React, and uses the local time for London, England as standard. Let me know if you would like to make any refinements to the code.";

export const CARDS: MetricCardData[] = [
  {
    id: "cost-per-hire",
    label: "Reduction in cost-per-hire",
    value: "83%",
    color: "#C4B5FD",
    type: "metric",
    category: "market",
    detail: {
      title: "Significant cost savings in recruiting",
      summary:
        "AI-driven sourcing dramatically reduces the cost of finding qualified candidates by automating outreach, screening, and initial engagement.",
      points: [
        "Average cost-per-hire dropped from $4,700 to $799 across enterprise clients",
        "Eliminated need for 3rd-party recruiting agencies in 78% of roles",
        "Time-to-fill reduced by 60%, compounding cost savings",
        "ROI positive within first month of deployment",
      ],
      source: "Internal benchmark study, Q3 2024",
    },
  },
  {
    id: "team-image",
    label: "Team collaboration",
    value: "",
    color: "transparent",
    type: "image",
    category: "market",
    detail: {
      title: "Collaborative hiring at scale",
      summary: "Teams using the platform report higher collaboration and faster decision-making.",
      points: [
        "Hiring managers spend 40% less time on admin tasks",
        "Interview panel coordination automated end-to-end",
        "Real-time candidate scoring visible to all stakeholders",
      ],
      source: "Customer interviews, 2024",
    },
  },
  {
    id: "testimonial-sarah",
    label: "Sarah, Direct Sourcing Consultant",
    value: "",
    color: "#DDD6FE",
    type: "testimonial",
    category: "market",
    author: "Sarah, Direct Sourcing Consultant",
    quote:
      "Popp is an easy-to-use AI tool that is making my life a lot easier — it is helping me cut down the number of calls I need to make to fill a booking. You can easily set up a campaign in ten minutes and move on to your next job.",
    detail: {
      title: "Consultant testimonial",
      summary: "Sarah has been using the platform for 8 months and has seen dramatic improvements.",
      points: [
        "Reduced daily outreach calls by 70%",
        "Campaign setup time went from 2 hours to 10 minutes",
        "Candidate quality improved due to better targeting",
        "Now handles 3x more open roles simultaneously",
      ],
      source: "Customer interview, August 2024",
    },
  },
  {
    id: "response-rate",
    label: "Increase in response rate",
    value: "4X",
    color: "#E5E7EB",
    type: "chart-bar",
    category: "market",
    detail: {
      title: "Dramatically higher candidate engagement",
      summary:
        "Personalized AI-crafted outreach messages achieve 4x the response rate compared to traditional templated emails.",
      points: [
        "Average response rate increased from 8% to 32%",
        "Messages are personalized using candidate profile data and role context",
        "A/B testing built in — top performing variants auto-selected",
        "Follow-up sequences optimized by ML model",
      ],
      source: "Platform analytics, 2024",
    },
  },
  {
    id: "satisfaction",
    label: "Candidate satisfaction rating",
    value: "4.8*",
    color: "#FCA5A5",
    type: "chart-ring",
    category: "idea",
    detail: {
      title: "Best-in-class candidate experience",
      summary: "Candidates rate their experience significantly higher when engaged through the platform.",
      points: [
        "4.8 out of 5 average rating across 12,000+ candidates surveyed",
        "92% said the process felt personalized and respectful",
        "Ghosting rate dropped by 65% compared to manual outreach",
        "Candidates are 3x more likely to refer others",
      ],
      source: "Candidate survey, Q2 2024",
    },
  },
  {
    id: "nps",
    label: "Increase in candidate NPS",
    value: "52%",
    color: "#6EE7B7",
    type: "chart-progress",
    category: "idea",
    detail: {
      title: "Net Promoter Score surging",
      summary:
        "Candidate NPS jumped 52 points after implementing AI-powered communication flows.",
      points: [
        "NPS went from +12 to +64 in 6 months",
        "Detractors reduced by 80% through faster response times",
        "Promoters increased as candidates felt more valued",
        "Employer brand perception improved across Glassdoor reviews",
      ],
      source: "NPS tracking dashboard, 2024",
    },
  },
];