const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: [
    'https://2insideservice.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.2insideservice.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Middleware adicional para manejar preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error al verificar Nodemailer:', error);
  } else {
    console.log('Nodemailer listo para enviar correos');
  }
});

app.post('/send-pdf', async (req, res) => {
  console.log('Solicitud recibida en /send-pdf:', req.body);
  const { 
    internalPdfBase64, 
    clientPdfBase64, 
    ticketPdfBase64,
    photos = [], 
    formId, 
    nombre, 
    dni,
    email,
    marca,
    modelo,
    codigo,
    patron,
    telefono, 
    storeLocation 
  } = req.body;

  if (!internalPdfBase64 || !clientPdfBase64 || !formId) {
    console.error('Datos inválidos o faltantes:', { internalPdfBase64, clientPdfBase64, formId });
    return res.status(400).json({ 
      error: 'Faltan datos requeridos (internalPdfBase64, clientPdfBase64 o formId)' 
    });
  }

  try {
    const internalPdfBuffer = Buffer.from(internalPdfBase64, 'base64');
    const clientPdfBuffer = Buffer.from(clientPdfBase64, 'base64');
    console.log('PDF interno convertido a buffer, tamaño:', internalPdfBuffer.length);
    console.log('PDF cliente convertido a buffer, tamaño:', clientPdfBuffer.length);

    let ticketPdfBuffer;
    if (ticketPdfBase64) {
      ticketPdfBuffer = Buffer.from(ticketPdfBase64, 'base64');
      console.log('PDF ticket convertido a buffer, tamaño:', ticketPdfBuffer.length);
    }

    const photoAttachments = photos.map((photo, index) => {
      try {
        const photoBuffer = Buffer.from(photo, 'base64');
        console.log(`Foto ${index + 1} convertida a buffer, tamaño:`, photoBuffer.length);
        return {
          filename: `foto-${formId}-${index + 1}.jpg`,
          content: photoBuffer,
          contentType: 'image/jpeg',
        };
      } catch (error) {
        console.error(`Error al procesar la foto ${index + 1}:`, error);
        throw new Error(`Formato inválido en la foto ${index + 1}`);
      }
    });

    const attachments = [
      {
        filename: `servicio-interno-${formId}.pdf`,
        content: internalPdfBuffer,
        contentType: 'application/pdf',
      },
      {
        filename: `comprobante-cliente-${formId}.pdf`,
        content: clientPdfBuffer,
        contentType: 'application/pdf',
      }
    ];

    if (ticketPdfBuffer) {
      attachments.push({
        filename: `ticket-servicio-${formId}.pdf`,
        content: ticketPdfBuffer,
        contentType: 'application/pdf',
      });
    }

    attachments.push(...photoAttachments);

    const ticketMessage = ticketPdfBuffer ? 'y ticket de servicio ' : '';

    let recipients = [process.env.EMAIL_USER, "2sinsidemedina@gmail.com"];
    
    if (storeLocation === 'villarcayo') {
      recipients.push("2sinsidevillarcayo@gmail.com");
    }

    const mailOptions = {
      from: `Soporte Técnico <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `Registro Técnico - ID: ${formId} - ${marca} ${modelo}  - ${nombre || 'Sin Nombre'} - ${dni || 'Sin DNI'} - ${telefono || 'Sin Teléfono'}`,
      text: `Adjuntamos el registro interno, el comprobante del cliente ${ticketMessage}en formato PDF junto con las fotos del dispositivo.\n\n` +
            `Cliente: ${nombre || 'No especificado'}\n` +
            `DNI: ${dni || 'No especificado'}\n` +
            `correo: ${email || 'No especificado'}\n` +
            `marca: ${marca || 'No especificada'}\n` +
            `modelo: ${modelo || 'No especificado'}\n` +
            `codigo: ${codigo || 'No especificado'}\n` +
            `patron: ${patron || 'No especificado'}\n` +
            `Teléfono: ${telefono || 'No especificado'}\n` +
            `Ciudad: ${storeLocation === 'medina' ? 'Medina de Pomar' : storeLocation === 'villarcayo' ? 'Villarcayo' : 'No especificada'}\n` +
            `ID Registro: ${formId}\n` +
            `Fotos adjuntas: ${photos.length}`,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado con éxito para ID:', formId, 'Info:', info);

    const ticketResponseMessage = ticketPdfBuffer ? ', ticket ' : ' ';
    return res.status(200).json({
      message: `PDFs (interno, cliente${ticketResponseMessage}) y ${photos.length} foto(s) enviados por correo con éxito`,
    });
  } catch (error) {
    console.error('Error enviando correo:', error);
    return res.status(500).json({
      error: error.message || 'Error al enviar los PDFs y fotos por correo',
    });
  }
});

app.post('/send-pdf-to-client', async (req, res) => {
  console.log('Solicitud recibida en /send-pdf-to-client:', req.body);
  const { pdfBase64, formId, nombre, dni, telefono, email } = req.body;

  if (!pdfBase64 || !formId || !email) {
    console.error('Datos inválidos o faltantes:', { pdfBase64, formId, email });
    return res.status(400).json({
      error: 'Faltan datos requeridos (pdfBase64, formId o email)',
    });
  }

  try {
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    console.log('PDF convertido a buffer, tamaño:', pdfBuffer.length);

    const mailOptions = {
      from: `Soporte Técnico <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Tu Comprobante de Servicio Técnico - ID: ${formId}`,
      text: `Hola ${nombre || 'Cliente'},\n\n` +
            `Adjuntamos tu comprobante de servicio técnico en formato PDF.\n\n` +
            `Detalles:\n` +
            `Cliente: ${nombre || 'No especificado'}\n` +
            `DNI: ${dni || 'No especificado'}\n` +
            `Teléfono: ${telefono || 'No especificado'}\n` +
            `ID Registro: ${formId}\n\n` +
            `Gracias por confiar en nosotros.`,
      attachments: [
        {
          filename: `comprobante-${formId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado con éxito a:', email, 'para ID:', formId, 'Info:', info);
    return res.status(200).json({
      message: `PDF enviado por correo a ${email} con éxito`,
    });
  } catch (error) {
    console.error('Error enviando correo al cliente:', error);
    return res.status(500).json({
      error: error.message || 'Error al enviar el PDF al cliente por correo',
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
