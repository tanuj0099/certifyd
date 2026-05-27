export const CERT_DATABASE = {
  "aws": [
    {
      rank: 1,
      id: "aws-saa",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      cost: "$150",
      difficulty: "Intermediate",
      timeToPrep: "2-3 Months",
      eligibility: "No strict prerequisites, but 1 year of hands-on AWS experience is highly recommended.",
      whyItMatters: "This is the undisputed gold standard for cloud computing. It proves you know how to design resilient, high-performing, and secure cloud infrastructure. It bypasses HR filters instantly.",
      howToPrepare: "Use Adrian Cantrill's course or Stephane Maarek on Udemy, combined with TutorialsDojo practice exams."
    },
    {
      rank: 2,
      id: "aws-dva",
      name: "AWS Certified Developer – Associate",
      issuer: "Amazon Web Services",
      cost: "$150",
      difficulty: "Intermediate",
      timeToPrep: "1-2 Months",
      eligibility: "No prerequisites. Best taken after the Solutions Architect exam.",
      whyItMatters: "Proves you can actually write and deploy code natively on AWS (Lambda, DynamoDB, API Gateway) rather than just clicking around the console.",
      howToPrepare: "Stephane Maarek's Udemy course is the industry standard for this specific exam."
    },
    {
      rank: 3,
      id: "aws-cp",
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      cost: "$100",
      difficulty: "Beginner",
      timeToPrep: "2-4 Weeks",
      eligibility: "Zero prerequisites. Designed for absolute beginners.",
      whyItMatters: "It is a vocabulary test for the cloud. Good for managers or absolute beginners, but carries very little weight for actual engineering roles.",
      howToPrepare: "AWS Skill Builder (Free) and AWS whitepapers."
    }
  ],
  "cybersecurity": [
    {
      rank: 1,
      id: "comp-sec",
      name: "CompTIA Security+",
      issuer: "CompTIA",
      cost: "$392",
      difficulty: "Beginner-Intermediate",
      timeToPrep: "1-3 Months",
      eligibility: "No hard prerequisites, though Network+ is recommended first.",
      whyItMatters: "The universal baseline for cybersecurity. It fulfills DoD 8570 compliance, meaning you literally cannot get a U.S. government/defense IT job without it.",
      howToPrepare: "Professor Messer's free YouTube series and Jason Dion's practice exams."
    }
    // ... add rank 2 and 3 here
  ]
};