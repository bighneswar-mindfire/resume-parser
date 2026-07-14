import { NlpParserService } from './services/nlpParser.js';

const mockResumeText = `
Bighneswar Bishoyi
Rourkela, Odisha
 +91 8249141054 # bishoyibighneswar@gmail.com ï Linkedin Ð Leetcode § GitHub
Professional Summary
Software Development Engineer with experience building full-stack web applications, backend APIs, and cloud-native
solutions. Skilled in React.js, Node.js, JavaScript, TypeScript, MongoDB, AWS, Docker, and Kubernetes. Experienced in
designing scalable systems, integrating third-party services, developing REST APIs, and delivering production-ready software.
Strong foundation in distributed systems, cloud architecture, software design, and modern web technologies.
Education
Indira Gandhi Institute of Technology December 2020 - June 2024
Bachelor of Technology in Computer Science(CGPA of 8.80) Odisha, India
Experience
Mindfire Solutions February 2025 – Present
Associate Software Developer
• Migrated a legacy FileMaker-based airline catering platform into a modern React-based web application, significantly
improving maintainability, performance, and user experience.
• Developing business workflows and application modules supporting airline catering operations and logistics.
• Integrated frontend modules with backend services and APIs to streamline operational processes and improve data
accuracy.
• Collaborated directly with Oman Air stakeholders to gather requirements, implement features, and optimize real-time
catering workflows.
• Participated in end-to-end software development including implementation, debugging, testing, deployment, and
production support.
Echio March 2024 – August 2024
Software Engineer Intern
• Developed video streaming functionality using React.js, HLS, and Adaptive Bitrate Streaming (ABR) technologies for
improved media delivery and user experience.
• Built reusable frontend components and integrated backend APIs to support scalable video streaming workflows.
• Designed and implemented a white-label customization platform using custom APIs and Material UI, enabling
multi-tenant branding across agency domains.
• Collaborated with engineering teams to deliver scalable features and improve platform usability.
Projects
SocialChirp | JavaScript, NodeJs, MongoDB, Express, AWS S3 | 4
• Developed a robust backend for SocialChirp using Node.js and MongoDB.
• Implemented secure authentication with Passport.js.
• Integrated AWS S3 for efficient image storage and retrieval, enabling users to upload and display images in tweets and
comments.
• Enhanced user engagement by implementing features like commenting on tweets, replying to comments, and
hashtag-based tweet search.
2048 Game Deployment on AWS EKS with Fargate | AWS EKS, Ingress Controller, Kubernetes | 4
• Deployed and managed a Kubernetes cluster using AWS Elastic Kubernetes Service (EKS) with Fargate.
• Deployed the 2048 game application from GitHub using kubectl.
• Set up Ingress controller for routing traffic within the cluster.
• Implemented an AWS Load Balancer using Helm for external access to the application.
Technical Skills
Languages: C++, Java, Python, JavaScript, TypeScript, SQL
Backend: Node.js, Express.js, REST APIs, MongoDB, Passport.js
Frontend: React.js, Redux, Material UI, HTML5, CSS3
Cloud & DevOps: AWS, Docker, Kubernetes, AWS EKS, Helm, Git
Testing: Playwright
Databases: MongoDB, Firestore, SQL
Concepts: Distributed Systems, API Design, Authentication & Authorization, Cloud Architecture, Event-Driven Systems,
Scalable Web Applications

-- 1 of 1 --


`;

const parsed = NlpParserService.parse(mockResumeText);
console.log('Parsed Output Result:\n', JSON.stringify(parsed, null, 2));
