import './formContainer.css';
import React, { useState, useRef } from 'react';
import PatternLock from '../patternComponent/patternComponent';
import {
  FaUser, FaPhone, FaEnvelope, FaLock, FaMobile, FaKey,
  FaEdit, FaMoneyBillWave, FaRedo, FaPrint
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import logoImg from '../../assets/logo.webp';
import logoImgSinFondo from '../../assets/logoSinFondo.webp';

interface FormData {
  DNI: string;
  Nombre: string;
  Telefono: string;
  AltTelefono: string;
  Marca: string;
  Modelo: string;
  Imei: string;
  Correo: string;
  ContrasenaCorreo: string;
  Codigo: string;
  DetallesEstadoActual: string;
  DetallesSoporteTecnico: string;
  Observaciones: string;
  Costo: string;
  Abono: string;
  Restante: string;
}

interface ProcessingState {
  print: boolean;
  send: boolean;
  sendToClient: boolean;
}

interface SectionItem {
  label: string;
  value: string;
}

function FormContainer() {
  const [formData, setFormData] = useState<FormData>({
    DNI: '',
    Nombre: '',
    Telefono: '',
    AltTelefono: '',
    Marca: '',
    Modelo: '',
    Imei: '',
    Correo: '',
    ContrasenaCorreo: '',
    Codigo: '',
    DetallesEstadoActual: '',
    DetallesSoporteTecnico: '',
    Observaciones: '',
    Costo: '',
    Abono: '',
    Restante: '',
  });

  const [pattern, setPattern] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<ProcessingState>({ print: false, send: false, sendToClient: false });
  const [message, setMessage] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'Costo' || name === 'Abono') {
        const costo = parseFloat(newData.Costo) || 0;
        const abono = parseFloat(newData.Abono) || 0;
        newData.Restante = (costo - abono).toFixed(2);
      }
      return newData;
    });
  };

  const handlePatternComplete = (newPattern: number[]) => {
    setPattern(newPattern);
  };

  const generatePDF = (formId: string): jsPDF => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    const logoWidth = 50;
    const logoHeight = logoWidth * (66 / 152);
    doc.addImage(logoImg, "PNG", margin, y, logoWidth, logoHeight);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    const titleX = margin + logoWidth + 10;
    doc.text("Comprobante de Servicio Técnico", titleX, y + 10);

    const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(`Fecha: ${today}`, titleX, y + 18);
    doc.setFontSize(8);
    doc.text(`ID: ${formId}`, titleX, y + 24);

    y += logoHeight + 15;

    const section = (title: string, content: SectionItem[]) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 51, 51);
      doc.text(title, margin + 5, y);

      y += 2;
      doc.setDrawColor(51, 51, 51);
      doc.setLineWidth(0.5);
      doc.line(margin + 5, y, margin + 5 + (pageWidth - margin * 2) * 0.7, y);
      y += 10;

      doc.setFontSize(11);
      doc.setTextColor(51, 51, 51);
      content.forEach((item: SectionItem) => {
        if (item.label) {
          doc.setFont("helvetica", "bold");
          doc.text(item.label, margin + 5, y);
          doc.setFont("helvetica", "normal");
          doc.text(item.value || "No especificado", pageWidth - margin - 50, y, { align: "right" });
        } else {
          const lines = doc.splitTextToSize(item.value || "No especificado", pageWidth - margin * 2 - 10);
          doc.text(lines, margin + 5, y);
          y += lines.length * 6;
        }
        y += 6;
      });
      y += 4;
    };

    section("Información del Cliente", [
      { label: "DNI:", value: formData.DNI },
      { label: "Nombre:", value: formData.Nombre },
      { label: "Teléfono:", value: formData.Telefono },
      { label: "Tel. Alternativo:", value: formData.AltTelefono },
    ]);

    section("Información del Dispositivo", [
      { label: "Marca:", value: formData.Marca },
      { label: "Modelo:", value: formData.Modelo },
      { label: "IMEI:", value: formData.Imei },
    ]);

    section("Estado Actual", [{ label: "", value: formData.DetallesEstadoActual }]);
    section("Soporte Técnico", [{ label: "", value: formData.DetallesSoporteTecnico }]);

    y += 4;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Presupuesto", margin + 5, y);
    y += 2;
    doc.setDrawColor(51, 51, 51);
    doc.line(margin + 5, y, margin + 5 + (pageWidth - margin * 2) * 0.7, y);
    y += 10;

    const budgetItems: SectionItem[] = [
      { label: "Costo:", value: formData.Costo ? `${formData.Costo} €` : "0.00 €" },
      { label: "Abono:", value: formData.Abono ? `${formData.Abono} €` : "0.00 €" },
      { label: "Restante:", value: formData.Restante ? `${formData.Restante} €` : "0.00 €" },
    ];

    budgetItems.forEach((item: SectionItem) => {
      doc.setFont("helvetica", "bold");
      doc.text(item.label, pageWidth - margin - 70, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, pageWidth - margin - 10, y, { align: "right" });
      y += 6;
    });

    y += -10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("No de Factura:", margin + 5, y);

    y += 15;

    const startYForPoliciesAndSAT = y;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Políticas de Servicio", margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    const policies: string[] = [
      "Dispositivos que no enciendan se reciben a riesgos del cliente.",
      "Fallas no vistas se cobrarán adicionalmente.",
      "Garantía perdida si es reparado por otro técnico.",
      "Pague el saldo restante y presente este recibo para retirar.",
      "Revisión se cobrará si no se acepta la reparación.",
    ];
    policies.forEach((policy: string) => {
      const lines = doc.splitTextToSize("• " + policy, (pageWidth - margin * 2) / 2);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    });

    y = startYForPoliciesAndSAT;
    const satData = [
      "Alain Garcia Orive - 72397028C",
      "Julian Garcia Sainz de Baranda S/N",
      "09500 Medina de Pomar (Burgos)",
    ];
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del S.A.T.", pageWidth - margin, y, { align: "right" });
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    satData.forEach((line) => {
      doc.text(line, pageWidth - margin, y, { align: "right" });
      y += 5;
    });

    const policiesHeight = policies.length * 5 + 10;
    const satDataHeight = satData.length * 5 + 10;
    y = startYForPoliciesAndSAT + Math.max(policiesHeight, satDataHeight);

    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.setFont("helvetica", "italic");
    doc.text("Gracias por confiar en nuestro servicio técnico", pageWidth / 2, pageHeight - 10, { align: "center" });

    return doc;
  };

  const generateInternalPDF = (formId: string): jsPDF => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;
    const logoWidth = 50;
    const logoHeight = logoWidth * (66 / 152);
    doc.addImage(logoImg, "PNG", margin, y, logoWidth, logoHeight);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    const titleX = margin + logoWidth + 10;
    doc.text("Registro Interno de Servicio Técnico", titleX, y + 10);
    const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(`Fecha: ${today}`, titleX, y + 18);
    doc.setFontSize(8);
    doc.text(`ID: ${formId}`, titleX, y + 24);
    y += logoHeight + 15;
    const section = (title: string, content: SectionItem[]) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 51, 51);
      doc.text(title, margin + 5, y);
      y += 2;
      doc.setDrawColor(51, 51, 51);
      doc.setLineWidth(0.5);
      doc.line(margin + 5, y, margin + 5 + (pageWidth - margin * 2) * 0.7, y);
      y += 10;
      doc.setFontSize(11);
      doc.setTextColor(51, 51, 51);
      content.forEach((item: SectionItem) => {
        if (item.label) {
          doc.setFont("helvetica", "bold");
          doc.text(item.label, margin + 5, y);
          doc.setFont("helvetica", "normal");
          doc.text(item.value || "No especificado", pageWidth - margin - 50, y, { align: "right" });
        } else {
          const lines = doc.splitTextToSize(item.value || "No especificado", pageWidth - margin * 2 - 10);
          doc.text(lines, margin + 5, y);
          y += lines.length * 6;
        }
        y += 6;
      });
      y += 4;
    };
    section("Información del Cliente", [
      { label: "DNI:", value: formData.DNI },
      { label: "Nombre:", value: formData.Nombre },
      { label: "Teléfono:", value: formData.Telefono },
      { label: "Tel. Alternativo:", value: formData.AltTelefono },
    ]);
    section("Información del Dispositivo", [
      { label: "Marca:", value: formData.Marca },
      { label: "Modelo:", value: formData.Modelo },
      { label: "IMEI:", value: formData.Imei },
      { label: "Correo:", value: formData.Correo },
      { label: "Contraseña Correo:", value: formData.ContrasenaCorreo },
      { label: "Código:", value: formData.Codigo },
      { label: "Patrón de Desbloqueo:", value: pattern.length > 0 ? pattern.join('-') : "No especificado" },
    ]);
    section("Estado Actual", [{ label: "", value: formData.DetallesEstadoActual }]);
    section("Soporte Técnico", [{ label: "", value: formData.DetallesSoporteTecnico }]);
    section("Observaciones", [{ label: "", value: formData.Observaciones }]);
    y += 4;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Presupuesto", margin + 5, y);
    y += 2;
    doc.setDrawColor(51, 51, 51);
    doc.line(margin + 5, y, margin + 5 + (pageWidth - margin * 2) * 0.7, y);
    y += 10;
    const budgetItems: SectionItem[] = [
      { label: "Costo:", value: formData.Costo ? `${formData.Costo} €` : "0.00 €" },
      { label: "Abono:", value: formData.Abono ? `${formData.Abono} €` : "0.00 €" },
      { label: "Restante:", value: formData.Restante ? `${formData.Restante} €` : "0.00 €" },
    ];
    budgetItems.forEach((item: SectionItem) => {
      doc.setFont("helvetica", "bold");
      doc.text(item.label, pageWidth - margin - 70, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, pageWidth - margin - 10, y, { align: "right" });
      y += 6;
    });
    y += 2;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("No de Factura:", margin + 5, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Políticas de Servicio", margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    const policies: string[] = [
      "Dispositivos que no enciendan se reciben a riesgos del cliente.",
      "Fallas no vistas se cobrarán adicionalmente.",
      "Garantía perdida si es reparado por otro técnico.",
      "Pague el saldo restante y presente este recibo para retirar.",
      "Revisión se cobrará si no se acepta la reparación.",
    ];
    policies.forEach((policy: string) => {
      doc.text("• " + policy, margin, y);
      y += 5;
    });
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.setFont("helvetica", "italic");
    doc.text("Gracias por confiar en nuestro servicio técnico", pageWidth / 2, pageHeight - 10, { align: "center" });
    return doc;
  };

  const handlePrint = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.Nombre || !formData.Telefono) {
      setMessage('Por favor, completa los campos obligatorios: Nombre y Teléfono');
      return;
    }
    setIsProcessing((prev) => ({ ...prev, print: true }));
    setMessage('Generando PDF para impresión...');
    try {
      const formId = `ST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const doc = generatePDF(formId);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        throw new Error('No se pudo abrir la ventana de impresión');
      }
      setMessage('PDF generado para impresión con éxito');
    } catch (error: unknown) {
      console.error('Error en impresión:', error);
      setMessage(`Error al generar el PDF para impresión: ${(error as Error).message || 'Desconocido'}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, print: false }));
    }
  };

  const handleSendEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.Nombre || !formData.Telefono) {
      setMessage('Por favor, completa los campos obligatorios: Nombre y Teléfono');
      return;
    }
    setIsProcessing((prev) => ({ ...prev, send: true }));
    setMessage('Enviando PDF por correo...');
    try {
      console.log('API URL cargada:', import.meta.env.VITE_API_URL);
      console.log('Generando PDF interno...');
      const formId = `ST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const doc = generateInternalPDF(formId);
      const pdfBlob = doc.output('blob');
      console.log('PDF interno generado, FormID:', formId, 'Tamaño del Blob:', pdfBlob.size);
      const pdfBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('FileReader onload ejecutado');
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result.split(',')[1]);
          } else {
            reject(new Error('El resultado del FileReader no es una cadena'));
          }
        };
        reader.onerror = () => {
          console.error('Error en FileReader:', reader.error);
          reject(new Error('Error al leer el Blob: ' + (reader.error?.message || 'Desconocido')));
        };
        reader.readAsDataURL(pdfBlob);
      });
      console.log('PDF convertido a base64, longitud:', pdfBase64.length);
      console.log('Enviando solicitud al backend...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64,
          formId,
          nombre: formData.Nombre,
          dni: formData.DNI,
          telefono: formData.Telefono,
        }),
      });
      console.log('Estado de la respuesta:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('Respuesta cruda del backend:', responseText);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} - ${responseText || 'Sin detalles'}`);
      }
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Respuesta parseada como JSON:', result);
      } catch (jsonError) {
        console.error('Error al parsear JSON:', jsonError);
        throw new Error(`Respuesta no válida del backend: ${responseText}`);
      }
      setMessage(`PDF enviado por correo con éxito (ID: ${formId})`);
    } catch (error: unknown) {
      console.error('Error en envío de correo:', error);
      const errorMessage = (error as Error).message || 'Error desconocido al enviar el PDF';
      setMessage(`Error al enviar el PDF por correo: ${errorMessage}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, send: false }));
    }
  };

  const handleSendEmailToClient = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.Nombre || !formData.Telefono) {
      setMessage('Por favor, completa los campos obligatorios: Nombre y Teléfono');
      return;
    }
    if (!formData.Correo) {
      setMessage('Por favor, ingresa el correo del cliente para enviar el PDF');
      return;
    }
    setIsProcessing((prev) => ({ ...prev, sendToClient: true }));
    setMessage('Enviando PDF al cliente por correo...');
    try {
      console.log('API URL cargada:', import.meta.env.VITE_API_URL);
      console.log('Generando PDF para el cliente...');
      const formId = `ST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const doc = generatePDF(formId);
      const pdfBlob = doc.output('blob');
      console.log('PDF generado, FormID:', formId, 'Tamaño del Blob:', pdfBlob.size);
      const pdfBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('FileReader onload ejecutado');
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result.split(',')[1]);
          } else {
            reject(new Error('El resultado del FileReader no es una cadena'));
          }
        };
        reader.onerror = () => {
          console.error('Error en FileReader:', reader.error);
          reject(new Error('Error al leer el Blob: ' + (reader.error?.message || 'Desconocido')));
        };
        reader.readAsDataURL(pdfBlob);
      });
      console.log('PDF convertido a base64, longitud:', pdfBase64.length);
      console.log('Enviando solicitud al backend para el cliente...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-pdf-to-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64,
          formId,
          nombre: formData.Nombre,
          dni: formData.DNI,
          telefono: formData.Telefono,
          email: formData.Correo,
        }),
      });
      console.log('Estado de la respuesta:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('Respuesta cruda del backend:', responseText);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} - ${responseText || 'Sin detalles'}`);
      }
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Respuesta parseada como JSON:', result);
      } catch (jsonError) {
        console.error('Error al parsear JSON:', jsonError);
        throw new Error(`Respuesta no válida del backend: ${responseText}`);
      }
      setMessage(`PDF enviado al cliente por correo con éxito (ID: ${formId})`);
    } catch (error: unknown) {
      console.error('Error en envío de correo al cliente:', error);
      const errorMessage = (error as Error).message || 'Error desconocido al enviar el PDF al cliente';
      setMessage(`Error al enviar el PDF al cliente por correo: ${errorMessage}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, sendToClient: false }));
    }
  };

  const handleReset = () => {
    setFormData({
      DNI: '',
      Nombre: '',
      Telefono: '',
      AltTelefono: '',
      Marca: '',
      Modelo: '',
      Imei: '',
      Correo: '',
      ContrasenaCorreo: '',
      Codigo: '',
      DetallesEstadoActual: '',
      DetallesSoporteTecnico: '',
      Observaciones: '',
      Costo: '',
      Abono: '',
      Restante: '',
    });
    setMessage('');
  };

  return (
    <div className="form-wrapper">
      <form className="form-container" ref={formRef}>
        <div className="header-container">
          <h1 className="form-header">Registro de Servicio Técnico</h1>
          <img src={logoImgSinFondo} alt="Logo" className="header-logo" />
        </div>

        <section className="section client-container">
          <h2 className="section-title">Información del Cliente</h2>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaUser /> DNI</label>
              <input type="text" name="DNI" value={formData.DNI} onChange={handleChange} />
            </div>
            <div className="element-container">
              <label className="input-label"><FaUser /> Nombre *</label>
              <input type="text" name="Nombre" value={formData.Nombre} onChange={handleChange} required />
            </div>
          </div>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaPhone /> Nº Teléfono *</label>
              <input type="number" name="Telefono" value={formData.Telefono} onChange={handleChange} required />
            </div>
            <div className="element-container">
              <label className="input-label"><FaPhone /> Alt. Teléfono</label>
              <input type="number" name="AltTelefono" value={formData.AltTelefono} onChange={handleChange} />
            </div>
          </div>
        </section>

        <section className="section phone-container">
          <h2 className="section-title">Información del Teléfono</h2>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaMobile /> Marca</label>
              <input type="text" name="Marca" value={formData.Marca} onChange={handleChange} />
            </div>
            <div className="element-container">
              <label className="input-label"><FaMobile /> Modelo</label>
              <input type="text" name="Modelo" value={formData.Modelo} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaKey /> IMEI</label>
              <input type="number" name="Imei" value={formData.Imei} onChange={handleChange} />
            </div>
            <div className="element-container">
              <label className="input-label"><FaEnvelope /> Correo</label>
              <input type="email" name="Correo" value={formData.Correo} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaLock /> Contraseña Correo</label>
              <input type="password" name="ContrasenaCorreo" value={formData.ContrasenaCorreo} onChange={handleChange} />
            </div>
            <div className="element-container">
              <label className="input-label"><FaKey /> Código</label>
              <input type="text" name="Codigo" value={formData.Codigo} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="element-container pattern-lock full-width">
              <label className="input-label"><FaLock /> Patrón de Desbloqueo</label>
              <PatternLock onPatternComplete={handlePatternComplete} pattern={pattern} />
            </div>
          </div>
        </section>

        <section className="section current-status">
          <h2 className="section-title">Estado Actual</h2>
          <div className="element-container full-width">
            <label className="input-label"><FaEdit /> Detalles</label>
            <textarea name="DetallesEstadoActual" value={formData.DetallesEstadoActual} onChange={handleChange} />
          </div>
        </section>

        <section className="section technical-support">
          <h2 className="section-title">Soporte Técnico</h2>
          <div className="element-container full-width">
            <label className="input-label"><FaEdit /> Detalles</label>
            <textarea name="DetallesSoporteTecnico" value={formData.DetallesSoporteTecnico} onChange={handleChange} />
          </div>
        </section>

        <section className="section observations">
          <h2 className="section-title">Observaciones</h2>
          <div className="element-container full-width">
            <label className="input-label"><FaEdit /> Observaciones</label>
            <textarea name="Observaciones" value={formData.Observaciones} onChange={handleChange} />
          </div>
        </section>

        <section className="section budget">
          <h2 className="section-title">Presupuesto</h2>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaMoneyBillWave /> Costo</label>
              <input type="number" name="Costo" value={formData.Costo} onChange={handleChange} step="0.01" />
            </div>
            <div className="element-container">
              <label className="input-label"><FaMoneyBillWave /> Abono</label>
              <input type="number" name="Abono" value={formData.Abono} onChange={handleChange} step="0.01" />
            </div>
          </div>
          <div className="row">
            <div className="element-container">
              <label className="input-label"><FaMoneyBillWave /> Restante</label>
              <input type="text" name="Restante" value={formData.Restante} readOnly />
            </div>
          </div>
        </section>

        <section className="section policies">
          <h2 className="section-title">Políticas</h2>
          <div className="policies-container">
            <ul className="policies-list">
              <li>Dispositivos que no enciendan se reciben a riesgos del cliente, debido a que no se podrá realizar un diagnóstico completo estando apagados.</li>
              <li>Si presenta una falla no vista, se cobrará adicionalmente. <span className="tooltip">Ejemplo: Daños ocultos en la placa base.</span></li>
              <li>Se pierde la garantía si el equipo es llevado a otro técnico diferente a nosotros.</li>
              <li>Para retirar el equipo, deberá pagar el saldo restante y presentar este recibo.</li>
              <li>En caso de no aceptar la reparación del equipo o el reclamo de garantía no fuera procedente, el cliente se compromete a pagar la revisión del mismo.</li>
            </ul>
          </div>
        </section>

        {message && <p className={`submit-message ${message.includes('Error') ? 'error' : ''}`}>{message}</p>}
        <div className="button-group">
          <button
            type="button"
            className="print-button"
            onClick={handlePrint}
            disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient}
          >
            <FaPrint style={{ marginRight: '8px' }} /> {isProcessing.print ? 'Imprimiendo...' : 'Imprimir'}
          </button>
          <button
            type="button"
            className="send-button"
            onClick={handleSendEmail}
            disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient}
          >
            <FaEnvelope style={{ marginRight: '8px' }} /> {isProcessing.send ? 'Enviando...' : 'Enviar por Correo'}
          </button>
          <button
            type="button"
            className="send-client-button"
            onClick={handleSendEmailToClient}
            disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient}
          >
            <FaEnvelope style={{ marginRight: '8px' }} /> {isProcessing.sendToClient ? 'Enviando...' : 'Enviar por Correo al Cliente'}
          </button>
        </div>
        <button
          type="button"
          className="reset-button"
          onClick={handleReset}
          disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient}
        >
          <FaRedo style={{ marginRight: '8px' }} /> Limpiar Formulario
        </button>
        <p>
          Desarrollado por{' '}
          <a href="https://github.com/Dammte" target="_blank" rel="noopener noreferrer">
            Daniel Jimenez
          </a>
        </p>
      </form>
    </div>
  );
}

export default FormContainer;