import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  FileText,
  Map,
  Shield,
  Database,
  Clock,
  AlertCircle,
  Award,
  Building2,
  Route as RouteIcon,
  GraduationCap,
} from 'lucide-react';

// Sample data for the feature boxes, mimicking the labels mentioned
const featureBoxesData = [
  {
    id: 'metrics_log',
    label: '// METRICS_LOG',
    title: 'Real-time ROI Tracking',
    content: 'Monitor your certification\'s financial impact with live data feeds and predictive analytics. See your break-even point and 5-year net gain updated daily.',
    icon: TrendingUp,
    dataPoint: '5-Year Net Gain: ₹12,50,000',
  },
  {
    id: 'sys_architecture',
    label: '// SYS_ARCHITECTURE',
    title: 'Secure & Scalable Infrastructure',
    content: 'Built on a high-trust enterprise architecture, ensuring data privacy and system reliability. Your career data is safe and always available.',
    icon: Shield,
    dataPoint: 'Uptime: 99.99%',
  },
  {
    id: 'industry_risks',
    label: '// INDUSTRY_RISKS',
    title: 'Mitigate Career Risks',
    content: 'Identify and address potential career stagnation or skill obsolescence with our proactive risk assessment tools. Stay ahead of market changes.',
    icon: AlertCircle,
    dataPoint: 'Risk Score: 0.08 (Low)',
  },
  {
    id: 'data_freshness',
    label: '// DATA_FRESHNESS',
    title: 'Always Current Data',
    content: 'Our datasets are updated quarterly from NASSCOM, LinkedIn India, and Naukri, ensuring you always have the most relevant and accurate market insights.',
    icon: Database,
    dataPoint: 'Last Update: Q1 2026',
  },
  {
    id: 'career_pathways',
    label: '// CAREER_PATHWAYS',
    title: 'Personalized Career Pathways',
    content: 'Leverage AI to map out optimal certification sequences tailored to your background and career aspirations. Visualize your growth trajectory.',
    icon: RouteIcon,
    dataPoint: 'Next Step: AWS SAA (3-6 months)',
  },
  {
    id: 'time_to_value',
    label: '// TIME_TO_VALUE',
    title: 'Accelerated Time-to-Value',
    content: 'Understand the precise time investment required for each certification and its expected payback period, optimizing your learning journey.',
    icon: Clock,
    dataPoint: 'Breakeven: 7.2 Months',
  },
  {
    id: 'cert_compare',
    label: '// CERT_COMPARE',
    title: 'Side-by-Side Certification Comparison',
    content: 'Directly compare two certifications on ROI, demand, and career impact to make informed decisions. Eliminate guesswork from your choices.',
    icon: Award,
    dataPoint: 'Cert A vs Cert B',
  },
  {
    id: 'job_mapping',
    label: '// JOB_MAPPING',
    title: 'Cert-to-Job Role Mapping',
    content: 'Discover which certifications are most valued or required for specific job roles across various industries and government sectors in India.',
    icon: Building2,
    dataPoint: 'Roles Matched: 150+',
  },
  {
    id: 'education_roi',
    label: '// EDUCATION_ROI',
    title: 'Degree vs. Certification ROI',
    content: 'Analyze the comparative return on investment between traditional degrees (e.g., MBA) and specialized certifications for career advancement.',
    icon: GraduationCap,
    dataPoint: 'MBA vs. PMP',
  },
];

// Framer Motion variants for staggered children reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger each child's animation by 0.1 seconds
    },
  },
};

// Framer Motion variants for individual box reveal
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut", // Fast, snappy easing
    },
  },
};

const CertAssemblyBentoGrid = () => {
  // CRITICAL LAYOUT RULE: This component assumes it is placed within a parent
  // container that already manages the left-side margin for the vertical
  // "APP // TOOL FLOW" text. This component focuses solely on the Bento grid
  // content and does not modify the structural placement of that sidebar.

  return (
    <div className="bg-gray-50 py-16 sm:py-24 lg:py-32"> {/* Global off-white background */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-base font-semibold text-gray-500 tracking-wide uppercase font-mono">
            // CERT_ASSEMBLY
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            High-Trust Enterprise Features
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Explore the core capabilities that power your career growth, built on a foundation of data integrity and robust architecture.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible" // Staggered scroll reveal
          viewport={{ once: true, amount: 0.3 }} // Trigger when 30% of the component is in view
        >
          {featureBoxesData.map((box) => (
            <motion.div
              key={box.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col justify-between" // Bento box styling
              variants={itemVariants}
              layout // Snappy layout expansion
              transition={{ type: "spring", stiffness: 300, damping: 30 }} // Snappy spring transition
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-gray-500 mb-2">
                  {box.label}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">
                  {box.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {box.content}
                </p>
              </div>
              {box.dataPoint && (
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600">
                    {box.icon && <box.icon size={16} className="mr-2 text-gray-500" />}
                    <span className="font-medium tabular-nums"> {/* Enforce tabular-nums */}
                      {box.dataPoint}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CertAssemblyBentoGrid;