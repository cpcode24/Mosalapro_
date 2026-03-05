/*********************************************************************************************************
*	emailsender.js : Handles email notifications sent to the user.
* Author: Constant Pagoui.
*	Date: 03-19-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const UserModel = require("../models/user");
const TokenModel = require("../models/token");
const CategoryModel = require("../models/category");
const passport = require("passport");
const log4js = require("log4js");
const logger = log4js.getLogger();


class EmailSender {

    async sendEmail(name, email, subject, message) {
        const axios = require("axios");
        const data = JSON.stringify({
            "Messages": [{
            "From": {"Email": process.env.EMAIL_SENDER, "Name": "MosalaPro"},
            "To": [{"Email": email, "Name": name}],
            "Subject": subject,
            "HTMLPart": message
            }]
        });
    
        const config = {
            method: 'post',
            url: 'https://api.mailjet.com/v3.1/send',
            data: data,
            headers: {'Content-Type': 'application/json'},
            auth: {username: process.env.MAILJET_API_KEY, password: process.env.MAILJET_API_SECRET},
        };
        
        return axios(config)
            .then(function (response) {
                //console.log(JSON.stringify(response.data));
            }).catch(function (error) {logger.error("EMAIL SENDER:: An error occured: "+error);});
    }
    
    async generateRandomString(strLength){
        const chars =
          "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
        const randomArray = Array.from(
          { length: strLength },
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
      
        const randomString = randomArray.join("");
        return randomString;
      }
    
      async generateRandomDigit(codeLength){
        const chars =
          "1234567890";
        const randomArray = Array.from(
          { length: codeLength},
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
        const code = randomArray.join("");
        return code;
      }
    
    async sendCode(codeLength, user){
        const chars =
        "1234567890";
      const randomArray = Array.from(
        { length: codeLength},
        (v, k) => chars[Math.floor(Math.random() * chars.length)]
      );
        const randomDigit =  randomArray.join("");

        let token = await new TokenModel({
            userId: user._id,
            token: randomDigit,
        }).save();

        const name = user.firstName;
        const email = user.email;
        const userIdd = user._id;
        const subject = "Your verification code is "+randomDigit;
        const emailContent = "Hi "+name+",\n\nThank you for signing up with MosalaPro"+(user.accountType === "provider"? "as a provider":" ") +
        ". We appreciate your business.\nPlease use the code below to verify your MosalaPro Account:\n\n"
            +randomDigit +"\n\nThank you,\nMosalaPro TM";

        const message = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css" integrity="sha512-ZfKn7az0YmtPUojZnRXO4CUdt3pn+ogBAyGbqGplrCIR5B/tQwPGtF2q29t+zQj6mC/20w4sSl0cF5F3r0HKSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  
    <style type="text/css">
      
      @media only screen and (min-width: 620px) {
        .u-row {
          width: 600px !important;
        }

        .u-row .u-col {
          vertical-align: top;
        }

        
            .u-row .u-col-36p67 {
              width: 220.02px !important;
            }
          

            .u-row .u-col-63p33 {
              width: 379.98px !important;
            }
          

            .u-row .u-col-100 {
              width: 600px !important;
            }
          
      }

      @media only screen and (max-width: 620px) {
        .u-row-container {
          max-width: 100% !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
        }

        .u-row {
          width: 100% !important;
        }

        .u-row .u-col {
          display: block !important;
          width: 100% !important;
          min-width: 320px !important;
          max-width: 100% !important;
        }

        .u-row .u-col > div {
          margin: 0 auto;
        }


}
    
body{margin:0;padding:0}table,td,tr{border-collapse:collapse;vertical-align:top}.ie-container table,.mso-container table{table-layout:fixed}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}


table, td { color: #000000; } @media (max-width: 480px) { #u_content_heading_1 .v-container-padding-padding { padding: 51px 10px 30px !important; } #u_content_heading_1 .v-text-align { text-align: center !important; } #u_content_heading_2 .v-container-padding-padding { padding: 20px 10px 27px !important; } #u_content_heading_3 .v-container-padding-padding { padding: 51px 10px 50px !important; } #u_content_text_1 .v-container-padding-padding { padding: 10px !important; } #u_content_button_1 .v-size-width { width: 80% !important; } #u_content_button_1 .v-container-padding-padding { padding: 10px !important; } #u_content_text_2 .v-container-padding-padding { padding: 10px 10px 40px !important; } #u_content_heading_4 .v-container-padding-padding { padding: 40px 10px 10px !important; } #u_content_heading_4 .v-text-align { text-align: center !important; } #u_content_text_3 .v-container-padding-padding { padding: 10px 40px 0px !important; } #u_content_text_3 .v-text-align { text-align: center !important; } #u_content_social_1 .v-container-padding-padding { padding: 30px 0px 20px 75px !important; } #u_content_text_4 .v-container-padding-padding { padding: 10px 0px !important; } #u_content_text_4 .v-font-size { font-size: 13px !important; } #u_content_text_4 .v-text-align { text-align: center !important; } #u_content_heading_6 .v-container-padding-padding { padding: 5px 10px 20px !important; } #u_content_heading_6 .v-text-align { text-align: center !important; } }
    </style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style=""><![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; background-color: #ffffff">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table id="u_content_heading_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 50px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
    <h1 class="v-text-align v-font-size" style="margin: 0px; color: #5A9E2F; line-height: 120%; text-align: left; word-wrap: break-word; font-size: 29px; font-weight: 400;"><span><span><span><span><span style="line-height: 34.8px;"><strong><span style="line-height: 34.8px;">Verify Your<br />MosalaPro Account </span></strong></span></span></span></span></span></h1>
  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_text_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; line-height: 160%; text-align: left; word-wrap: break-word;">
<p style="line-height: 160%; margin: 0px;">Hi ${name},</p><br />
<p style="line-height: 160%; margin: 0px;">Thank you for choosing MosalaPro. We appreciate your business.</p>
<p style="line-height: 160%; margin: 0px;">Enter the 6-digit code below to verify your MosalaPro Account. </p>
<p style="line-height: 160%; margin: 0px; margin: 20px 0; text-align: center; font-size:x-large;"><b>${randomDigit}</b> </p>
<div class="v-text-align" align="center">      
  <!--[if mso]><table border="0" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#5A9E2F" style="padding: 20px;" valign="top"><![endif]-->
  <a href="https://mosalapro.com/verified/${userIdd}" target="_blank" class="v-button v-size-width v-font-size" style="box-sizing: border-box; display: inline-block; text-decoration: none; text-size-adjust: none; text-align: center; color: rgb(255, 255, 255); background: #5A9E2F; border-radius: 4px; width: 53%; max-width: 100%; word-break: break-word; overflow-wrap: break-word; font-size: 14px; line-height: inherit;"><span style="display:block;padding:10px 20px;line-height:120%;"><span style="line-height: 16.8px;">Verify my account</span></span>
    </a>
    <!--[if mso]></td></tr></table><![endif]-->
</div>
            
<p style="line-height: 160%; margin: 30px 0;"><br />Thank you,<br>MosalaPro TM <br /></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>


  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  
    <!--[if gte mso 9]>
      </v:textbox></v:rect>
    </td>
    </tr>
    </table>
    <![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  

<table id="u_content_text_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 60px 10px 40px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 170%; text-align: left; word-wrap: break-word;">
<p style="line-height: 170%; text-align: center; margin: 0px; padding-bottom:10px; color: #6c757d; font-size:small; ">We are proud to be the most effective professional service finder platform.<br />Follow us on social media</p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_social_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 20px 40px;font-family:'Raleway',sans-serif;" align="left">
        
<div align="center" style="direction: ltr;">
  <div style="display: table; max-width:245px;">
  <!--[if (mso)|(IE)]><table width="245" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:245px;"><tr><![endif]-->
  
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://twitter.com/MosalaPro" title="X" style="color: #5A9E2F; text-decoration:none;">X (Twitter)</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.linkedin.com/company/mosalapro" style="color: #5A9E2F; text-decoration:none; " title="LinkedIn" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">LinkedIn</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="70" style="width:70px; padding-right: 0px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0" style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.facebook.com/people/Mosalapro/100064060309267/" style="color: #5A9E2F; text-decoration:none; " title="Facebook" target="_blank" >Facebook</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    
    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
</div>

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:'Raleway',sans-serif;" align="left">
        
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="92%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
          <span>&#160;</span>
        </td>
      </tr>
    </tbody>
  </table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="379" style="background-color: #ffffff;width: 379px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-63p33" style="max-width: 320px;min-width: 379.98px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_text_4" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 20px 30px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 140%; text-align: left; word-wrap: break-word;">
<p style="line-height: 140%; margin: 0px;"><a href="https://mosalapro.com/" style="color: #5A9E2F; text-decoration:none;">UNSUBSCRIBE </a>   |   <a href="https://mosalapro.com/privacy-policy" style="color: #5A9E2F; text-decoration:none;">PRIVACY POLICY   </a></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="220" style="background-color: #ffffff; color: #5A9E2F; width: 220px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-36p67" style="max-width: 320px;min-width: 220.02px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_heading_6" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 20px;font-family:'Raleway',sans-serif;" align="right">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
      <a style="background-color: #ffffff; color: #5A9E2F; text-decoration:none;"><img src="https://storage.googleapis.com/mosalapro-com.appspot.com/img/mosalapro-logo-h.png" width="auto" height="40">
     </a>

  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>
`;
            
        logger.info("EMAIL_SENDER:: An Email sent to your account please verify");
        if(this.sendEmail(name, email, subject, message))
            return true;
        else
            return false;
        
      }

      async sendHelpRequestAck(name, email){
       
        const subject = "We have received your request";

        const message = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css" integrity="sha512-ZfKn7az0YmtPUojZnRXO4CUdt3pn+ogBAyGbqGplrCIR5B/tQwPGtF2q29t+zQj6mC/20w4sSl0cF5F3r0HKSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  
    <style type="text/css">
      
      @media only screen and (min-width: 620px) {
        .u-row {
          width: 600px !important;
        }

        .u-row .u-col {
          vertical-align: top;
        }

        
            .u-row .u-col-36p67 {
              width: 220.02px !important;
            }
          

            .u-row .u-col-63p33 {
              width: 379.98px !important;
            }
          

            .u-row .u-col-100 {
              width: 600px !important;
            }
          
      }

      @media only screen and (max-width: 620px) {
        .u-row-container {
          max-width: 100% !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
        }

        .u-row {
          width: 100% !important;
        }

        .u-row .u-col {
          display: block !important;
          width: 100% !important;
          min-width: 320px !important;
          max-width: 100% !important;
        }

        .u-row .u-col > div {
          margin: 0 auto;
        }


}
    
body{margin:0;padding:0}table,td,tr{border-collapse:collapse;vertical-align:top}.ie-container table,.mso-container table{table-layout:fixed}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}


table, td { color: #000000; } @media (max-width: 480px) { #u_content_heading_1 .v-container-padding-padding { padding: 51px 10px 30px !important; } #u_content_heading_1 .v-text-align { text-align: center !important; } #u_content_heading_2 .v-container-padding-padding { padding: 20px 10px 27px !important; } #u_content_heading_3 .v-container-padding-padding { padding: 51px 10px 50px !important; } #u_content_text_1 .v-container-padding-padding { padding: 10px !important; } #u_content_button_1 .v-size-width { width: 80% !important; } #u_content_button_1 .v-container-padding-padding { padding: 10px !important; } #u_content_text_2 .v-container-padding-padding { padding: 10px 10px 40px !important; } #u_content_heading_4 .v-container-padding-padding { padding: 40px 10px 10px !important; } #u_content_heading_4 .v-text-align { text-align: center !important; } #u_content_text_3 .v-container-padding-padding { padding: 10px 40px 0px !important; } #u_content_text_3 .v-text-align { text-align: center !important; } #u_content_social_1 .v-container-padding-padding { padding: 30px 0px 20px 75px !important; } #u_content_text_4 .v-container-padding-padding { padding: 10px 0px !important; } #u_content_text_4 .v-font-size { font-size: 13px !important; } #u_content_text_4 .v-text-align { text-align: center !important; } #u_content_heading_6 .v-container-padding-padding { padding: 5px 10px 20px !important; } #u_content_heading_6 .v-text-align { text-align: center !important; } }
    </style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style=""><![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; background-color: #ffffff">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table id="u_content_heading_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 50px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
    <h1 class="v-text-align v-font-size" style="margin: 0px; color: #5A9E2F; line-height: 120%; text-align: left; word-wrap: break-word; font-size: 29px; font-weight: 400;"><span><span><span><span><span style="line-height: 34.8px;"><strong><span style="line-height: 34.8px;">We have received your request.</span></strong></span></span></span></span></span></h1>
  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_text_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; line-height: 160%; text-align: left; word-wrap: break-word;">
<p style="line-height: 160%; margin: 0px;">Hi ${name},</p><br />
<p style="line-height: 160%; margin: 0px;">Thank you for contacting MosalaPro Support.</p>
<p style="line-height: 160%; margin: 0px;">Your request has been submitted. A Technical Support Agent will be contacting you soon. </p>
            
<p style="line-height: 160%; margin: 30px 0;"><br />Thank you,<br>MosalaPro TM <br /></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>


  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  
    <!--[if gte mso 9]>
      </v:textbox></v:rect>
    </td>
    </tr>
    </table>
    <![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  

<table id="u_content_text_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 60px 10px 40px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 170%; text-align: left; word-wrap: break-word;">
<p style="line-height: 170%; text-align: center; margin: 0px; padding-bottom:10px; color: #6c757d; font-size:small; ">We are proud to be the most effective professional service finder platform.<br />Follow us on social media</p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_social_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 20px 40px;font-family:'Raleway',sans-serif;" align="left">
        
<div align="center" style="direction: ltr;">
  <div style="display: table; max-width:245px;">
  <!--[if (mso)|(IE)]><table width="245" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:245px;"><tr><![endif]-->
  
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://twitter.com/MosalaPro" title="X" style="color: #5A9E2F; text-decoration:none;">X (Twitter)</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.linkedin.com/company/mosalapro" style="color: #5A9E2F; text-decoration:none; " title="LinkedIn" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">LinkedIn</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="70" style="width:70px; padding-right: 0px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0" style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.facebook.com/people/Mosalapro/100064060309267/" style="color: #5A9E2F; text-decoration:none; " title="Facebook" target="_blank" >Facebook</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    
    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
</div>

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:'Raleway',sans-serif;" align="left">
        
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="92%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
          <span>&#160;</span>
        </td>
      </tr>
    </tbody>
  </table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="379" style="background-color: #ffffff;width: 379px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-63p33" style="max-width: 320px;min-width: 379.98px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_text_4" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 20px 30px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 140%; text-align: left; word-wrap: break-word;">
<p style="line-height: 140%; margin: 0px;"><a href="https://mosalapro.com/" style="color: #5A9E2F; text-decoration:none;">UNSUBSCRIBE </a>   |   <a href="https://mosalapro.com/privacy-policy" style="color: #5A9E2F; text-decoration:none;">PRIVACY POLICY   </a></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="220" style="background-color: #ffffff; color: #5A9E2F; width: 220px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-36p67" style="max-width: 320px;min-width: 220.02px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_heading_6" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 20px;font-family:'Raleway',sans-serif;" align="right">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
      <a style="background-color: #ffffff; color: #5A9E2F; text-decoration:none;"><img src="https://storage.googleapis.com/mosalapro-com.appspot.com/img/mosalapro-logo-h.png" width="auto" height="40">
     </a>

  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>`
;            
        logger.info("EMAIL_SENDER:: Email sent to user.");
        if(this.sendEmail(name, email, subject, message))
            return true;
        else
            return false;
        
      }

      async sendHelpRequestToTeam(userFullName, userEmail, userMessage){
       
        const subject = "New Help Request Message - "+userFullName;
        const message = "Hello,\n\n A user has submitted the following message through the 'Contact Us' form:\n\n"+
        "User's full name: " + userFullName +
        "\nUser's email: "+ userEmail +
        "\nUser's message:  "+ userMessage +
        "\n\nThank you,\nMosalaPro TM";
            
        logger.info("EMAIL_SENDER:: Email sent to MosalaPro TM.");
        if(this.sendEmail("Help Request", process.env.MSP_EMAIL, subject, message))
            return true;
        else
            return false;
        
      }


    async sendRecoveryCode(codeLength, user){
      const chars =
        "1234567890";
        const randomArray = Array.from(
          { length: codeLength},
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
        const randomDigit =  randomArray.join("");

        let token = await new TokenModel({
            userId: user._id,
            token: randomDigit,
        }).save();

        const name = user.firstName;
        const email = user.email;
        const subject = "Your account recovery code is "+randomDigit;

        const message = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css" integrity="sha512-ZfKn7az0YmtPUojZnRXO4CUdt3pn+ogBAyGbqGplrCIR5B/tQwPGtF2q29t+zQj6mC/20w4sSl0cF5F3r0HKSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  
    <style type="text/css">
      
      @media only screen and (min-width: 620px) {
        .u-row {
          width: 600px !important;
        }

        .u-row .u-col {
          vertical-align: top;
        }

        
            .u-row .u-col-36p67 {
              width: 220.02px !important;
            }
          

            .u-row .u-col-63p33 {
              width: 379.98px !important;
            }
          

            .u-row .u-col-100 {
              width: 600px !important;
            }
          
      }

      @media only screen and (max-width: 620px) {
        .u-row-container {
          max-width: 100% !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
        }

        .u-row {
          width: 100% !important;
        }

        .u-row .u-col {
          display: block !important;
          width: 100% !important;
          min-width: 320px !important;
          max-width: 100% !important;
        }

        .u-row .u-col > div {
          margin: 0 auto;
        }


}
    
body{margin:0;padding:0}table,td,tr{border-collapse:collapse;vertical-align:top}.ie-container table,.mso-container table{table-layout:fixed}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}


table, td { color: #000000; } @media (max-width: 480px) { #u_content_heading_1 .v-container-padding-padding { padding: 51px 10px 30px !important; } #u_content_heading_1 .v-text-align { text-align: center !important; } #u_content_heading_2 .v-container-padding-padding { padding: 20px 10px 27px !important; } #u_content_heading_3 .v-container-padding-padding { padding: 51px 10px 50px !important; } #u_content_text_1 .v-container-padding-padding { padding: 10px !important; } #u_content_button_1 .v-size-width { width: 80% !important; } #u_content_button_1 .v-container-padding-padding { padding: 10px !important; } #u_content_text_2 .v-container-padding-padding { padding: 10px 10px 40px !important; } #u_content_heading_4 .v-container-padding-padding { padding: 40px 10px 10px !important; } #u_content_heading_4 .v-text-align { text-align: center !important; } #u_content_text_3 .v-container-padding-padding { padding: 10px 40px 0px !important; } #u_content_text_3 .v-text-align { text-align: center !important; } #u_content_social_1 .v-container-padding-padding { padding: 30px 0px 20px 75px !important; } #u_content_text_4 .v-container-padding-padding { padding: 10px 0px !important; } #u_content_text_4 .v-font-size { font-size: 13px !important; } #u_content_text_4 .v-text-align { text-align: center !important; } #u_content_heading_6 .v-container-padding-padding { padding: 5px 10px 20px !important; } #u_content_heading_6 .v-text-align { text-align: center !important; } }
    </style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style=""><![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; background-color: #ffffff">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table id="u_content_heading_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 50px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
    <h1 class="v-text-align v-font-size" style="margin: 0px; color: #5A9E2F; line-height: 120%; text-align: left; word-wrap: break-word; font-size: 29px; font-weight: 400;"><span><span><span><span><span style="line-height: 34.8px;"><strong><span style="line-height: 34.8px;">Here's Your MosalaPro<br />Account Recovery Code </span></strong></span></span></span></span></span></h1>
  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_text_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; line-height: 160%; text-align: left; word-wrap: break-word;">
<p style="line-height: 160%; margin: 0px;">Hi ${name},</p><br />
<p style="line-height: 160%; margin: 0px;">We received a request to reset your MosalaPro password.</p>
<p style="line-height: 160%; margin: 0px;">Enter the 6-digit code below to change your MosalaPro Account password. </p>
<p style="line-height: 160%; margin: 0px; margin: 20px 0; text-align: center; font-size:x-large;"><b>${randomDigit}</b> </p>
            
<p style="line-height: 160%; margin: 30px 0;"><br />Thank you,<br>MosalaPro TM <br /></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>


  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  
    <!--[if gte mso 9]>
      </v:textbox></v:rect>
    </td>
    </tr>
    </table>
    <![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  

<table id="u_content_text_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 60px 10px 40px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 170%; text-align: left; word-wrap: break-word;">
<p style="line-height: 170%; text-align: center; margin: 0px; padding-bottom:10px; color: #6c757d; font-size:small; ">We are proud to be the most effective professional service finder platform.<br />Follow us on social media</p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_social_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 20px 40px;font-family:'Raleway',sans-serif;" align="left">
        
<div align="center" style="direction: ltr;">
  <div style="display: table; max-width:245px;">
  <!--[if (mso)|(IE)]><table width="245" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:245px;"><tr><![endif]-->
  
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://twitter.com/MosalaPro" title="X" style="color: #5A9E2F; text-decoration:none;">X (Twitter)</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.linkedin.com/company/mosalapro" style="color: #5A9E2F; text-decoration:none; " title="LinkedIn" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">LinkedIn</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="70" style="width:70px; padding-right: 0px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0" style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.facebook.com/people/Mosalapro/100064060309267/" style="color: #5A9E2F; text-decoration:none; " title="Facebook" target="_blank" >Facebook</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    
    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
</div>

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:'Raleway',sans-serif;" align="left">
        
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="92%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
          <span>&#160;</span>
        </td>
      </tr>
    </tbody>
  </table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="379" style="background-color: #ffffff;width: 379px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-63p33" style="max-width: 320px;min-width: 379.98px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_text_4" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 20px 30px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 140%; text-align: left; word-wrap: break-word;">
<p style="line-height: 140%; margin: 0px;"><a href="https://mosalapro.com/" style="color: #5A9E2F; text-decoration:none;">UNSUBSCRIBE </a>   |   <a href="https://mosalapro.com/privacy-policy" style="color: #5A9E2F; text-decoration:none;">PRIVACY POLICY   </a></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="220" style="background-color: #ffffff; color: #5A9E2F; width: 220px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-36p67" style="max-width: 320px;min-width: 220.02px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_heading_6" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 20px;font-family:'Raleway',sans-serif;" align="right">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
      <a style="background-color: #ffffff; color: #5A9E2F; text-decoration:none;"><img src="https://storage.googleapis.com/mosalapro-com.appspot.com/img/mosalapro-logo-h.png" width="auto" height="40">
     </a>

  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>
`;
            
        logger.info("EMAIL_SENDER:: An Email sent to your account please verify");
        if(this.sendEmail(name, email, subject, message))
            return true;
        else
            return false; 
    }

    async sendNotification(notifTitle, notifContent, receiverEmail, receiverName){

        const message = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css" integrity="sha512-ZfKn7az0YmtPUojZnRXO4CUdt3pn+ogBAyGbqGplrCIR5B/tQwPGtF2q29t+zQj6mC/20w4sSl0cF5F3r0HKSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  
    <style type="text/css">
      
      @media only screen and (min-width: 620px) {
        .u-row {
          width: 600px !important;
        }

        .u-row .u-col {
          vertical-align: top;
        }

        
            .u-row .u-col-36p67 {
              width: 220.02px !important;
            }
          

            .u-row .u-col-63p33 {
              width: 379.98px !important;
            }
          

            .u-row .u-col-100 {
              width: 600px !important;
            }
          
      }

      @media only screen and (max-width: 620px) {
        .u-row-container {
          max-width: 100% !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
        }

        .u-row {
          width: 100% !important;
        }

        .u-row .u-col {
          display: block !important;
          width: 100% !important;
          min-width: 320px !important;
          max-width: 100% !important;
        }

        .u-row .u-col > div {
          margin: 0 auto;
        }


}
    
body{margin:0;padding:0}table,td,tr{border-collapse:collapse;vertical-align:top}.ie-container table,.mso-container table{table-layout:fixed}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}


table, td { color: #000000; } @media (max-width: 480px) { #u_content_heading_1 .v-container-padding-padding { padding: 51px 10px 30px !important; } #u_content_heading_1 .v-text-align { text-align: center !important; } #u_content_heading_2 .v-container-padding-padding { padding: 20px 10px 27px !important; } #u_content_heading_3 .v-container-padding-padding { padding: 51px 10px 50px !important; } #u_content_text_1 .v-container-padding-padding { padding: 10px !important; } #u_content_button_1 .v-size-width { width: 80% !important; } #u_content_button_1 .v-container-padding-padding { padding: 10px !important; } #u_content_text_2 .v-container-padding-padding { padding: 10px 10px 40px !important; } #u_content_heading_4 .v-container-padding-padding { padding: 40px 10px 10px !important; } #u_content_heading_4 .v-text-align { text-align: center !important; } #u_content_text_3 .v-container-padding-padding { padding: 10px 40px 0px !important; } #u_content_text_3 .v-text-align { text-align: center !important; } #u_content_social_1 .v-container-padding-padding { padding: 30px 0px 20px 75px !important; } #u_content_text_4 .v-container-padding-padding { padding: 10px 0px !important; } #u_content_text_4 .v-font-size { font-size: 13px !important; } #u_content_text_4 .v-text-align { text-align: center !important; } #u_content_heading_6 .v-container-padding-padding { padding: 5px 10px 20px !important; } #u_content_heading_6 .v-text-align { text-align: center !important; } }
    </style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style=""><![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; background-color: #ffffff">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table id="u_content_heading_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 50px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
    <h1 class="v-text-align v-font-size" style="margin: 0px; color: #5A9E2F; line-height: 120%; text-align: left; word-wrap: break-word; font-size: 29px; font-weight: 400;"><span><span><span><span><span style="line-height: 34.8px;"><strong><span style="line-height: 34.8px;">${notifTitle} </span></strong></span></span></span></span></span></h1>
  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_text_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 43px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; line-height: 160%; text-align: left; word-wrap: break-word;">
<p style="line-height: 160%; margin: 0px;">Hi ${receiverName},</p><br />
<p style="line-height: 160%; margin: 0px;">${notifContent}</p> <br />
<p style="line-height: 160%; margin: 0px;">Login to your account or open the link https://mosalapro.com/notifications to check your notifications. </p>
            
<p style="line-height: 160%; margin: 30px 0;"><br />Thank you,<br>MosalaPro TM <br /></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>


  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  
    <!--[if gte mso 9]>
      </v:textbox></v:rect>
    </td>
    </tr>
    </table>
    <![endif]-->
    
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  

<table id="u_content_text_3" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 60px 10px 40px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 170%; text-align: left; word-wrap: break-word;">
<p style="line-height: 170%; text-align: center; margin: 0px; padding-bottom:10px; color: #6c757d; font-size:small; ">We are proud to be the most effective professional service finder platform.<br />Follow us on social media</p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

<table id="u_content_social_1" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 20px 40px;font-family:'Raleway',sans-serif;" align="left">
        
<div align="center" style="direction: ltr;">
  <div style="display: table; max-width:245px;">
  <!--[if (mso)|(IE)]><table width="245" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:245px;"><tr><![endif]-->
  
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://twitter.com/MosalaPro" title="X" style="color: #5A9E2F; text-decoration:none;">X (Twitter)</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="32" style="width:70px; padding-right: 10px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0"  style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 10px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.linkedin.com/company/mosalapro" style="color: #5A9E2F; text-decoration:none; " title="LinkedIn" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">LinkedIn</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    <!--[if (mso)|(IE)]><td width="70" style="width:70px; padding-right: 0px;" valign="top"><![endif]-->
    <table border="0" cellspacing="0" cellpadding="0" style="width: 70px !important; height: 32px !important;display: inline-block;border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
      <tbody><tr style="vertical-align: top"><td valign="middle" style="word-break: keep-all;border-collapse: collapse !important;vertical-align: top">
<a href="https://www.facebook.com/people/Mosalapro/100064060309267/" style="color: #5A9E2F; text-decoration:none; " title="Facebook" target="_blank" >Facebook</a>
        </a>
      </td></tr>
    </tbody></table>
    <!--[if (mso)|(IE)]></td><![endif]-->
    
    
    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
  </div>
</div>

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:'Raleway',sans-serif;" align="left">
        
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="92%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
          <span>&#160;</span>
        </td>
      </tr>
    </tbody>
  </table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px; ">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word; ;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%; ;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px; ;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style=" ;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="379" style="background-color: #ffffff;width: 379px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-63p33" style="max-width: 320px;min-width: 379.98px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_text_4" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 20px 30px;font-family:'Raleway',sans-serif;" align="left">
        
  <div class="v-text-align v-font-size" style="font-size: 14px; color: #5A9E2F; line-height: 140%; text-align: left; word-wrap: break-word;">
<p style="line-height: 140%; margin: 0px;"><a href="https://mosalapro.com/" style="color: #5A9E2F; text-decoration:none;">UNSUBSCRIBE </a>   |   <a href="https://mosalapro.com/privacy-policy" style="color: #5A9E2F; text-decoration:none;">PRIVACY POLICY   </a></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="220" style="background-color: #ffffff; color: #5A9E2F; width: 220px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
<div class="u-col u-col-36p67" style="max-width: 320px;min-width: 220.02px;display: table-cell;vertical-align: top;">
  <div style="background-color: #ffffff;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
  
<table id="u_content_heading_6" style="font-family:'Raleway',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:5px 20px;font-family:'Raleway',sans-serif;" align="right">
        
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
      <a style="background-color: #ffffff; color: #5A9E2F; text-decoration:none;"><img src="https://storage.googleapis.com/mosalapro-com.appspot.com/img/mosalapro-logo-h.png" width="auto" height="40">
     </a>

  <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>
`;
            
        
        if(this.sendEmail(receiverName, receiverEmail, notifTitle, message)){
            logger.info("EMAIL_SENDER:: Notification's email sent to user");
            console.log("EMAIL_SENDER:: Notification's email sent to user");
            return true;
        }
        else{
            logger.error("EMAIL_SENDER:: An error occured. Could not send email to user.");
            return false;
        }
    }
}



module.exports = EmailSender;