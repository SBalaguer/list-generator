"use strict";

const { Router } = require("express");
const router = new Router();
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");

//******************************************************************************************
//SETING UP NODEMAILER
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.NODEMAIL_MAIL,
    pass: process.env.NODEMAIL_PASSWORD
  }
});
//******************************************************************************************

const createExcelWorkbook = function(listPrice) {
  const ws = XLSX.utils.json_to_sheet(listPrice);

  // /* add to workbook */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "People");

  // /* write workbook */
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }); // generate a nodejs buffer
  return buf;
};

router.get("/", (req, res, next) => {
  res.json({ greeting: "hello world" });
});

router.post("/", async (req, res, next) => {
  //console.log("req.body", req.body.listPrice[0].priceList);
  //console.log(req.body[listPrice][0][priceList]);
  try {
    const listPrices = req.body.listPrice;
    //console.log(listPrices);
    for (let i = 0; i < listPrices.length; i++) {
      const listPrice = listPrices[i].priceList;
      const mail = listPrices[i].mail;
      const ae = listPrices[i].ae;
      const custNumb = listPrices[i].customerNumber;
      const buf = createExcelWorkbook(listPrice);
      const attachments = [
        {
          // binary buffer as an attachment
          filename: "newListPrice.xlsx",
          content: new Buffer(buf, "utf-8")
        }
      ];
      await transporter.sendMail({
        from: `PG Lists <${process.env.NODEMAIL_MAIL}>`,
        to: mail,
        subject: "[IMPORTANT] New List Price",
        //text: 'This should be the body of the text email'
        html: `
      </style>
      <h1 style="color: Black">Hi ${ae}!</h1>
      <h3 style="color: Black">Please dind attached the new List Price Information regarding customer Number ${custNumb}</h3>
      <p style="color: Red">Please keep in mind that list prices are private to each customer.</p>
      <small>This is an automatic mail, please do not respond.</small>
    `,
        attachments: attachments
      });
    }
    res.json({ status: "success" });
  } catch (error) {
    res.json({ status: "error" });
    // console.log(error);
  }
});

module.exports = router;
