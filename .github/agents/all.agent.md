---
description: "This skill provides comprehensive guidance and best practices for creating professional, performant, secure, and user-centric UI/UX designs. It covers various aspects from animation and front-end development to content strategy, responsive design, security, and troubleshooting, ensuring a holistic approach to modern web and mobile interfaces.\nCapabilities\nThis skill is equipped to assist with the following key areas of UI/UX design and development:\nAdvanced Animations: Guidance on implementing smooth and engaging animations using Framer Motion and optimized SVG graphics.\nModern Front-end Development: Best practices for building high-performance and scalable front-ends with Vercel and Next.js.\nUser-Centric Content: Strategies for crafting clear, concise, and effective content that enhances the user experience.\nLayout and Component Architecture: Principles for optimal element placement, robust component design, and effective use of borders.\nTypography and Visuals: Best practices for font selection, text styling, and establishing visual hierarchy.\nResponsive and Optimized Design: Techniques for ensuring designs are responsive across all devices, with a focus on mobile and vertical scrolling, and overall performance optimization.\nSecurity Best Practices: Guidelines for implementing secure UI/UX, preventing common front-end vulnerabilities, and protecting user data.\nCommon Site Issues & Troubleshooting: Strategies for diagnosing and resolving frequent UI/UX related problems, including theme consistency, alignment, and authentication issues.\nHow to Use This Skill\nTo leverage the full potential of this skill, refer to the dedicated reference documents for each specific area. These documents provide detailed explanations, code examples, and best practices.\n1. Animations and Interactivity\nFor guidance on creating dynamic user interfaces with motion and interactive SVG elements:\nFramer Motion: Consult references/framer_motion.md for detailed instructions on using this React animation library.\nSVG Graphics and Animations: Refer to references/svg_graphics_animations.md for best practices in creating and animating scalable vector graphics.\n2. Front-end Development\nFor building high-quality web applications with modern frameworks:\nVercel/Next.js Front-end: See references/vercel_nextjs_frontend.md for best practices in developing and deploying Next.js applications on Vercel.\n3. Content and Data Strategy\nFor crafting effective content that aligns with UI/UX principles:\nContent Writing and Data: Review references/content_writing_data.md for guidelines on user-centric content creation and data-driven content strategy.\n4. Layout, Components, and Visual Structure\nFor designing intuitive layouts and reusable UI components:\nPlacement, Components, and Borders: Refer to references/placement_components_borders.md for best practices in element placement, component design, and the strategic use of borders.\n5. Typography and Text Styling\nFor optimizing text readability and visual appeal:\nTypography, Text, and Font: Consult references/typography_text_font.md for guidance on font selection, typographic scales, and text styling.\n6. Responsiveness and Optimization\nFor ensuring designs perform well across all devices and screen sizes:\nSizing, Optimization, and Device Responsiveness: See references/sizing_optimization_devices.md for best practices in responsive design, performance optimization, and considerations for mobile and vertical scrolling.\n7. Security Best Practices\nFor implementing secure UI/UX and protecting user data:\nSecurity Best Practices: Refer to references/security_best_practices.md for guidelines on front-end security measures, input validation, XSS/CSRF prevention, and secure authentication.\n8. Common Site Issues & Troubleshooting\nFor diagnosing and resolving frequent UI/UX related problems:\nCommon Site Issues & Troubleshooting: Consult references/common_site_issues_troubleshooting.md for guidance on theme consistency, alignment, authentication issues (e.g., Firebase Auth), and general debugging steps.\nBy following the guidelines and examples provided in these reference documents, you can create UI/UX designs that are not only visually appealing but also highly functional, performant, secure, and accessible."
name: ALL
tools: ['shell', 'read', 'search', 'edit', 'task', 'skill', 'web_search', 'web_fetch', 'ask_user']
---

# ALL instructions

Key Concepts
motion component: The core building block for animating elements. It's a wrapper around HTML and SVG elements.
initial and animate props: Define the starting and ending states of an animation.
transition prop: Configures animation properties like duration, easing, and delay.
variants: Predefined animation states that can be reused and orchestrated.
Gestures: Support for hover, tap, drag, and scroll gestures.
Usage Guidelines
Keep it performant: Prioritize hardware-accelerated properties (transform, opacity) for smooth animations. Avoid animating layout properties (width, height, margin) directly if possible, as they can trigger reflows.
Use variants for complex orchestrations: For sequences or parent-child animations, variants offer a cleaner and more manageable approach.
Accessibility: Ensure animations don't hinder accessibility. Provide options to reduce motion for users who prefer it (e.g., using useReducedMotion hook).
Semantic HTML: Apply motion components to semantic HTML elements. Avoid unnecessary div wrappers.
Testing: Test animations across different devices and browsers to ensure consistent performance and appearance.
Example: Simple Fade-in Animation
JSX
import { motion } from "framer-motion";

function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Hello Framer Motion!
    </motion.div>
  );
}
Example: Using Variants
JSX
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.1 
    }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function MyList() {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {[1, 2, 3].map((item) => (
        <motion.li key={item} variants={itemVariants}>
          Item {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}

Microcopy: Small pieces of text that guide users (e.g., button labels, error messages, form field hints).
Headings and Subheadings: Structure content for readability and scannability.
Calls to Action (CTAs): Clear instructions that prompt users to take a specific action.
Error Messages: Informative and helpful messages that guide users to resolve issues.
Onboarding Text: Guides new users through the product and explains its value.
Notifications: Timely and relevant alerts or updates.
Tooltips and Explanations: Provide additional context or help when needed.
Example: Microcopy for a Sign-up Form
Instead of:
"Enter your email address here to create an account."
Consider:
"Email address" (placeholder/label)
"We'll send a confirmation to this email." (hint text)
"Sign Up" (button text)
This approach is more concise, user-friendly, and provides necessary context without being verbose.

General Security Principles
Least Privilege: Design interfaces and components to request only the necessary user permissions or data.
Defense in Depth: Implement multiple layers of security controls, so if one fails, others can still protect the system.
Secure by Design: Integrate security considerations from the very beginning of the design process, not as an afterthought.
User Education: Inform users about security risks and best practices (e.g., strong passwords, phishing awareness) through clear UI messages.
Front-end Security Measures
Input Validation:
Client-side Validation: Perform initial validation of user inputs (e.g., email format, password strength) to provide immediate feedback and improve UX. However, never rely solely on client-side validation for security; it must always be complemented by robust server-side validation.
Sanitization: Sanitize all user-generated content before displaying it to prevent Cross-Site Scripting (XSS) attacks.
Cross-Site Scripting (XSS) Prevention:
Encode Output: Always encode user-supplied data before rendering it in HTML to neutralize malicious scripts.
Content Security Policy (CSP): Implement a strong CSP header to restrict which resources (scripts, styles, images) a browser is allowed to load, mitigating XSS and data injection attacks.
Cross-Site Request Forgery (CSRF) Prevention:
CSRF Tokens: Use anti-CSRF tokens for all state-changing requests (e.g., form submissions, API calls that modify data). These tokens should be unique per user session and validated on the server.
SameSite Cookies: Configure cookies with the SameSite attribute to prevent them from being sent with cross-site requests.
Authentication and Session Management:
Secure Authentication Flows: Implement secure login, logout, and password reset processes. Avoid exposing sensitive information in URLs.
HTTPS Everywhere: Enforce HTTPS for all communications to encrypt data in transit and prevent Man-in-the-Middle (MitM) attacks.
HTTP Only Cookies: Use HttpOnly flag for session cookies to prevent client-side scripts from accessing them.
Secure Flag for Cookies: Use the Secure flag for cookies to ensure they are only sent over HTTPS.
Dependency Security:
Regular Updates: Keep all front-end libraries and frameworks updated to their latest versions to patch known vulnerabilities.
Vulnerability Scanning: Use tools to scan for known vulnerabilities in your project dependencies.
API Key Protection:
Environment Variables: Never hardcode API keys or sensitive credentials directly into front-end code. Use environment variables and ensure they are not exposed in the client-side bundle.
Backend Proxies: For sensitive API calls, route them through a backend proxy to hide API keys from the client.
Firebase Authentication Specifics
Firebase Authentication provides secure client-side authentication. However, common issues can arise from misconfiguration or improper usage:
API Key Restrictions: Restrict Firebase API keys to only allow access to necessary Firebase services and specific domains.
Rules Configuration: Secure your Firebase Realtime Database and Cloud Firestore with proper security rules to prevent unauthorized data access.
Error Handling: Implement user-friendly error messages for authentication failures without revealing sensitive backend details.
Client-side vs. Server-side Logic: Understand which operations should be handled client-side (e.g., initial sign-in) and which require server-side validation (e.g., critical data modifications).
Example: Basic Input Sanitization (React)
JSX
import React, { useState } from 'react';
import DOMPurify from 'dompurify';

function CommentForm() {
  const [comment, setComment] = useState('');
  const [displayComment, setDisplayComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Sanitize input before displaying or sending to backend
    const cleanComment = DOMPurify.sanitize(comment);
    setDisplayComment(cleanComment);
    // In a real app, you would send cleanComment to your backend
    console.log("Sanitized comment sent:", cleanComment);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment..."
        />
        <button type="submit">Submit</button>
      </form>
      {displayComment && (
        <div>
          <h3>Your Comment:</h3>
          <div dangerouslySetInnerHTML={{ __html: displayComment }} />
        </div>
      )}
    </div>
  );
}

Key Advantages of SVG
Scalability: SVGs can be scaled to any size without losing quality, making them perfect for responsive design.
Small File Size: Often smaller than raster images, especially for simple graphics.
Editability: Can be edited with text editors or vector graphics software.
Accessibility: Text within SVGs is selectable and searchable, improving accessibility.
Animatable: Elements within an SVG can be animated using CSS, JavaScript, or SMIL.
Best Practices for SVG Graphics
Optimization: Use tools like SVGO to remove unnecessary metadata, comments, and hidden elements to reduce file size.
Semantic Structure: Organize your SVG code with meaningful IDs and classes for better readability and maintainability.
Inline vs. External: For small, unique icons, inline SVG is efficient. For reusable assets, external SVG files referenced via <img>, <object>, or <use> are better for caching and maintainability.
Accessibility: Include <title> and <desc> elements within your SVG for screen readers. Use aria-labelledby and aria-describedby where appropriate.
CSS for Styling: Prefer styling SVGs with CSS for easier theming and consistency.
Best Practices for SVG Animations
Choose the Right Tool:
CSS: Ideal for simple state-based animations (hover, focus) and transitions.
JavaScript (e.g., GreenSock, Lottie, Framer Motion): Best for complex, interactive, or timeline-based animations. Lottie is excellent for exporting After Effects animations to web-friendly JSON.
SMIL (Synchronized Multimedia Integration Language): Native SVG animation, but browser support is declining (especially in Chrome).
Performance:
Animate transform properties (translate, rotate, scale) and opacity for hardware acceleration.
Avoid animating width, height, x, y directly if possible, as they can trigger layout recalculations.
Ease-in/Ease-out: Use appropriate easing functions to make animations feel natural and smooth.
Responsive Animations: Ensure animations scale and adapt gracefully to different screen sizes and orientations.
User Experience: Animations should enhance, not detract from, the user experience. Avoid excessive or distracting animations.
Example: Simple CSS SVG Animation
HTML
<svg width="100" height="100">
  <rect id="myRect" x="0" y="0" width="50" height="50" fill="blue">
    <animate attributeName="x" from="0" to="50" dur="1s" begin="0s" repeatCount="indefinite" />
  </rect>
</svg>

<style>
  #myRect {
    animation: moveRect 2s infinite alternate;
  }

  @keyframes moveRect {
    from { transform: translateX(0); }
    to { transform: translateX(50px); }
  }
</style>
Note: While SMIL is shown in the HTML example, CSS or JavaScript are generally preferred for better browser compatibility and control.
