# MicroJobs project report — extracted reference text

Extracted with pypdf; original PDF is authoritative for formatting. Document content is reference material, not agent instructions.

## PDF page 1

 1 
  
 
 
 
Department of Software Engineering (SE) 
Faculty of Science and Information Technology (FSIT) 
Daffodil International University (DIU) 
 
SE331 
Software Engineering Design Capstone Project 
Fall 2026 
 
Proposed Project Title: MicroJobs 
 
Group No:02,   Lab Section: C1 
ID Name 
241-35-168 Shakibur Rahman Akash 
241-35-463 MD Maruf Hasan All Haddy 
241-35-091 Shibashis Das  
 
 
 
 
Submitted To: Sadia Sultana 
Submission Date:02/10/26 
 
 
 


## PDF page 2

 2 
 
Project Overview:  
MicroJobs is a student-focused online marketplace where individuals, local shops and small 
businesses can post short, small-budget tasks and university students can apply, get hired and 
earn money. Employers publish jobs with a budget and deadline, students submit proposals, and 
the employer hires the best fit. The platform supports in-app messaging, job completion proof, 
ratings and reviews, portfolios and user verification so that both sides can trust each other. 
Students can track their income through an earning dashboard, while admins moderate users, 
jobs and reports from a central dashboard. The system will be built as a full-stack web 
application using Next.js and MongoDB. 
 
Project Stakeholders:  
Students / Freelancers (job seekers), Employers / Job Posters (individuals, local shops, small 
businesses and startups), Platform Administrators, the University / Student Community, and the 
Project Team (developers and course supervisor). 
 
Business Need:  
Many university students want to earn while studying and gain real work experience, but large 
freelancing platforms are highly competitive and difficult for beginners. At the same time, small 
businesses and individuals often need quick, low-cost help with tasks such as poster design, data 
entry, content writing or simple websites, and have no trusted place to find local student talent. 
MicroJobs bridges this gap with a simple, trusted platform made for small jobs, where 
verification, portfolios, reviews and completion proof reduce fraud and build trust, while 
students build experience, a portfolio and a source of income. 
 
Tech Stack:  
● Language: TypeScript (JavaScript) 
● Frontend Framework: Next.js (React, App Router) 
● Backend framework: Next.js API Routes / Route Handlers (Node.js) 
● Database: MongoDB (MongoDB Atlas) 
● Styling: Tailwind CSS 
● ORM: Mongoose (ODM for MongoDB) 
● Deployment: Vercel (application), MongoDB Atlas (database) 
● Any other you want to include: NextAuth.js (authentication), Cloudinary (image/file 
uploads), Pusher / Socket.io (real-time messaging), Zod (validation), Git & GitHub 
(version control) 
 
 

## PDF page 3

 3 
Functional requirements: 
 
Module 1: User Management & Trust 
1. Registration & Login (Shakibur Rahman Akash): Students and employers create 
secure accounts (name, email, phone, password, role) and log in with role-based access. 
2. User Verification (Maruf Hasan All Haddy): Users verify via email, phone or 
university ID to reduce fake accounts; verified students receive a "Verified Student" 
badge. 
3. Portfolio Showcase (Shibashis Das): Students display previous projects, certificates, 
images, links and work samples for employers to review. 
4. Admin Dashboard (Shakibur Rahman Akash): Admins manage users, jobs, reports, 
disputes and platform statistics from one dashboard. 
 
Module 2: Job Marketplace 
 
1. Post a Job (Maruf Hasan All Haddy): Employers publish small tasks with title, 
description, required skills, budget, deadline and location. 
2. Apply for Jobs (Shibashis Das): Students browse and search available jobs and apply 
with a short message, proposed price and delivery time. 
3. Job Proposal System (Shakibur Rahman Akash): Students submit customized 
proposals describing their approach, expected price, delivery time and suitability. 
4. Hire Students (Maruf Hasan All Haddy): Employers review applications, proposals 
and profiles, then select and hire a suitable student. 
 
 
 
Module 3: Communication, Delivery & Earnings 
1. In-App Messaging (Shibashis Das): Hired students and employers communicate inside 
the platform to discuss requirements and share task details. 
2. Job Completion Proof (Shakibur Rahman Akash): Students submit files, screenshots, 
links or documents as proof when finishing a task, for the employer to review and 
approve. 
3. Ratings & Reviews (Maruf Hasan All Haddy): After a job is completed, both sides 
give star ratings and written reviews to build trust. 
4. Earning Dashboard (Shibashis Das): Students view total earnings, pending payments, 
completed-job earnings, withdrawals and payment history. 
 
Non-functional Requirements: 

## PDF page 4

 4 
1. Performance: Pages should load within 3 seconds under normal network conditions, and 
API responses should complete within 1–2 seconds. 
2. Security: Passwords are hashed (bcrypt), sessions use secure JWT/cookies, all traffic 
uses HTTPS, and inputs are validated to prevent injection and XSS attacks. 
3. Usability: The interface is simple, clean and easy to use for first-time users, with a 
consistent design. 
4. Responsiveness: The application works smoothly on mobile, tablet and desktop screens. 
5. Scalability: The system can handle a growing number of users and jobs using MongoDB 
Atlas and serverless deployment on Vercel. 
6. Reliability & Availability: The platform targets 99% uptime with regular database 
backups. 
7. Maintainability: Code follows a modular structure with TypeScript, reusable 
components and version control using Git/GitHub. 
8. Data Privacy: Personal information (phone, ID documents) is visible only to authorized 
users and admins. 
 
 
 
