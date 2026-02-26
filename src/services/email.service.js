import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

//  google has their different smtp servers for handling emails 
// to interact with that servers we create the transporter
// but because the smtp servers are not free
// so to just contact with the smtp servers we need these details
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"All yours Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// function to send registration email
export async function sendRegistrationEmail(userEmail , name){
    const subject = "Welcome to All_yours Backend Ledger !"
    const text = `Hello ${name},\n\nThank you for registering at Backend Ledger, we are excited to have you on board!\n\nBest regards,\nThe All yours Backend Ledger Team`;

    const html =`<p>Hello ${name},</p><p>Thank you registering at Backend Ledger. We are excited to have you on board!</p><p>Best regargds,<br>The All_yours Backedn Ledger Team</p>`;

    await sendEmail(userEmail, subject , text , html);
}

