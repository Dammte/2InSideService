const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'soporte2insidemovil@gmail.com',
    pass: 'rmyb cqyr ctlq nyij',
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
  const { pdfBase64, formId, nombre, dni, telefono } = req.body;

  if (!pdfBase64 || !formId) {
    console.error('Datos inválidos o faltantes:', { pdfBase64, formId });
    return res.status(400).json({ error: 'Faltan datos requeridos (pdfBase64 o formId)' });
  }

  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  console.log('PDF convertido a buffer, tamaño:', pdfBuffer.length);

  const mailOptions = {
    from: 'Soporte Técnico <soporte2insidemovil@gmail.com>',
    to: 'soporte2insidemovil@gmail.com',
    subject: `Registro Técnico - ID: ${formId} - ${nombre || 'Sin Nombre'} - ${dni || 'Sin DNI'}`,
    text: `Adjuntamos tu registro de servicio técnico en formato PDF.\n\n` +
          `Cliente: ${nombre || 'No especificado'}\n` +
          `DNI: ${dni || 'No especificado'}\n` +
          `Teléfono: ${telefono || 'No especificado'}\n` +
          `ID Registro: ${formId}`,
    attachments: [
      {
        filename: `servicio-${formId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado con éxito para ID:', formId, 'Info:', info);
    res.status(200).json({ message: 'PDF enviado por correo con éxito' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ error: error.message || 'Error al enviar el PDF por correo' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});