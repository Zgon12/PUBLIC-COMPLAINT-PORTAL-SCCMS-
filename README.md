# Public-Complaint-Portal
A Public Complaint Website which uses algorithms to classify various types of Issues faced by the public into categories to help the government understand the scale of the issues and prioritize the issue accordingly. 


# Flow of project: 

Phase 1:

1. AI training and enhancement
2. User login via email and OTP
3. User enters main.html 
4. User submits complaint and AI gives back the category
5. User gets 4 digit id for the complaint


Phase 2:
1. Admin module development
2. Admin can see the categories of complaints which are highest
3. Admin can change the status of the complaints to pending, working, completed.
4. Admin gets graph analytics of the complaint data
5. User recieves updates about the complaints using email and 4 digit id


Phase 3:
1. Another management module for creating categories
2. This will create unique complaints and will have separate categories
3. Working on the UI and CSS
4. Final full flow testing of the website


Optional Add-ons:
1. Adding categories directly to the python AI
2. Creating new codes for these specific new categories
3. People can see who else is facing the problem
4. Many issues may be region specific so ask the user about the region as well
5. Try to put their contact number as their password


Must addons in ai :

05. Roads & Infrastructure

Sub-categories:

Road damage and potholes
Poor construction and maintenance
Drainage-related road issues
Pedestrian infrastructure issues


06. Drainage & Sanitation

Sub-categories:

Blocked or overflowing drainage
Poor sewage infrastructure
Water stagnation and hygiene risks


07. Public Safety & Nuisance

Sub-categories:

Stray animals
Noise pollution
Physical hazards (trees, obstructions)
Unsafe public environment


08. Government & Administrative

Sub-categories:

Delays and inefficiency
Corruption and lack of transparency
Illegal activities and enforcement failure

# About the project: 
Our project is about developing a website which classifies public issues into various categories so that it is easier for the authorities to understand which issue is faced by the most people and which issue requires immediate attention.
The user flow of our website is : 
1. The user enters their email and gets an otp for login.
2. The user lands on the home page where there are two options: raise an issue & track the issue progress.
3. The user gets a simple textbox in which the user can describe the issue in informal/slang language and get a prediction for the complaint category.
4. If the user is satisfied they can confirm and get a 4 digit issue number with which they can track the issue's progress.
5. If the user is dissatisfied with the category, a retry option is available which gives the second closest category.
6. If the user still does not get any satisfying results, they may register the issue as other category in which they can define the category in 2-3 words and the admin will look into it and add the category as per the needs.
7. The 4-digit issue id is not unique or random, it is specifically used for single issue with category as first 2 digits and sub-category as last 2 digits.
8. The admin can see how many complaints of the same issue have been raised and take action accordingly.
9. The admin can also update the status of issues as pending, in-progress, or resolved.
10. The admin uses an 8 digit tracking id instead of 4 but the last 4 digits are the same as the users'. The first 4 digits are to specify the quantity of complaints about the specific issue.

The website is made for the sole purpose of giving useful insights about the public issues to the authorities in order to take appropriate action on these issues.

The classification is based on python using sentence-transformers as its core, the rest of the website is created using HTML, CSS, JS and mongodb for database, nodemailer for otp, express-session for verifying otp on time, git hub to store the code.