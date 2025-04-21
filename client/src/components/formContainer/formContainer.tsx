import './formContainer.css';
import React, { useState, useRef, useEffect } from 'react';
import PatternLock from '../patternComponent/patternComponent';
import PhotoCapture from '../photoCapture/photoCapture';
import {
  FaUser, FaPhone, FaEnvelope, FaLock, FaMobile, FaKey,
  FaEdit, FaMoneyBillWave, FaAngleDown, FaAngleUp
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import logoImg from '../../assets/logo.webp';
import logoImgSinFondo from '../../assets/logoSinFondo.webp';
import qrcode from '../../assets/qrcode.webp';
import PrintComponent from '../printComponent/printComponent';
import JsBarcode from "jsbarcode";


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
  Patron: string;
  DetallesEstadoActual: string;
  DetallesSoporteTecnico: string;
  Observaciones: string;
  Costo: string;
  Abono: string;
  Restante: string;
  Fecha: string;
}

interface ProcessingState {
  print: boolean;
  send: boolean;
  sendToClient: boolean;
  sendToWhatsApp: boolean;
}

interface SectionItem {
  label: string;
  value: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const servicePolicies = [
  "De acuerdo con la LOPD, el cliente debe entregar el terminal sin tarjeta de memoria ni SIM. No nos hacemos responsables de su pérdida, así como de fundas o accesorios, si no son retirados.",
  "El tiempo máximo de almacenamiento y custodia sin coste será de 60 días desde el primer aviso de reparación. Posteriormente, se cobrará 1 €/día.",
  "Pasados 6 meses desde la comunicación al cliente, se entenderá que renuncia al terminal, pasando este a desmontaje y reciclaje, reservándonos el derecho a recuperar piezas nuevas y desechar el resto.",
  "Para cualquier reclamación, será imprescindible presentar este resguardo. El servicio técnico declina toda responsabilidad por su pérdida.",
  "A causa de la reparación, es posible que se pierdan datos. Recomendamos realizar una copia de seguridad previa.",
  "La apertura del terminal puede derivar en la pérdida de la garantía del fabricante, no responsabilizándonos de reclamaciones por este motivo.",
  "La reparación tendrá una garantía de 90 días desde la recepción, salvo conectores de carga o pantallas, que será de 5 días. No cubre otras anomalías similares o iguales que puedan presentarse.",
  "El titular podrá ejercer los derechos de acceso, rectificación, cancelación y oposición según la legislación vigente en protección de datos.",
  "No nos responsabilizamos de defectos adicionales detectados tras la reparación. Si se identifican, se avisará y presupuestará su reparación.",
  "Aconsejamos realizar una copia de seguridad y restaurar el teléfono a valores de fábrica. No nos hacemos responsables de la pérdida de datos.",
  "En caso de cambio de componentes de marca Apple, el dispositivo debe entregarse formateado. De lo contrario, el cliente proporcionará sus claves para la copia de seguridad, declinando cualquier responsabilidad legal sobre datos personales.",
  "Dispositivos que no enciendan se reciben a riesgos del cliente, debido a que no se podrá realizar un diagnóstico completo estando apagados.",
  "Si presenta una falla no vista, se cobrará adicionalmente. Ejemplo: Daños ocultos en la placa base.",
  "Se pierde la garantía si el equipo es llevado a otro técnico diferente a nosotros.",
  "Para retirar el equipo, deberá pagar el saldo restante y presentar este recibo.",
  "En caso de no aceptar la reparación del equipo o el reclamo de garantía no fuera procedente, el cliente se compromete a pagar la revisión del mismo.",
];

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
    Patron: '',
    DetallesEstadoActual: '',
    DetallesSoporteTecnico: '',
    Observaciones: '',
    Costo: '',
    Abono: '',
    Restante: '',
    Fecha: '',
  });

  const [pattern, setPattern] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<ProcessingState>({ print: false, send: false, sendToClient: false, sendToWhatsApp: false });
  const [message, setMessage] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [storeLocation, setStoreLocation] = useState<string>(() => {
    const savedLocation = localStorage.getItem('storeLocation');
    return savedLocation ? savedLocation : 'medina';
  });
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formId, setFormId] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('storeLocation', storeLocation);
  }, [storeLocation]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFinalize = async () => {
    if (!formData.Nombre || !formData.Telefono) {
      setMessage('Por favor, completa los campos obligatorios: Nombre y Teléfono');
      return;
    }
    const newFormId = `ST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setFormId(newFormId);
    setIsFinalized(true);

    try {
      await handleSendEmail(newFormId);
      setNotification({ message: 'PDFs y fotos enviados por correo con éxito', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error al enviar PDFs y fotos por correo', type: 'error' });
      console.error('Error al enviar PDFs y fotos por correo:', error);
    }
  };

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

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStoreLocation(e.target.value);
  };

  const handlePatternComplete = (newPattern: number[]) => {
    setPattern(newPattern);
  };

  const handlePhotosChange = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    setMessage(`Fotos actualizadas: ${newPhotos.length} capturada(s)`);
  };

  const handleResetForm = () => {
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
      Patron: '',
      DetallesEstadoActual: '',
      DetallesSoporteTecnico: '',
      Observaciones: '',
      Costo: '',
      Abono: '',
      Restante: '',
      Fecha: '',
    });
    setPhotos([]);
    setPattern([]);
    setMessage('');
    setIsPoliciesOpen(false);
  };

  const generateLabelPDF = (formData: FormData, logo = logoImg): jsPDF => {
    const width = 249.45;
    const height = 110;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [width, height],
    });

    const margin = 8;
    const lineHeight = 10;
    const labelWidth = 28;

    let currentY = 8;

    if (logo) {
      const logoWidth = 24;
      const logoHeight = 12;
      doc.addImage(logo, "PNG", margin, currentY - 3, logoWidth, logoHeight);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Etiqueta de Servicio Técnico", margin + logoWidth + 5, currentY + 5);
    } else {
      console.log("Logo no está disponible :(");
    }

    currentY += 14;
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY - 2, width - margin, currentY - 2);

    currentY += 8;

    const col1X = margin;
    const col2X = width / 2 - 30;
    const col3X = width - 85;

    doc.setFontSize(7);

    if (formData.Nombre) {
      const nombre = formData.Nombre.length > 15 ? formData.Nombre.substring(0, 13) + ".." : formData.Nombre;
      doc.setFont("helvetica", "bold");
      doc.text("Nombre:", col1X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(nombre, col1X + labelWidth + 2, currentY);
    }

    if (formData.Telefono) {
      doc.setFont("helvetica", "bold");
      doc.text("Tel:", col2X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Telefono, col2X + 15, currentY);
    }

    if (formData.Fecha) {
      doc.setFont("helvetica", "bold");
      doc.text("Fecha:", col3X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Fecha, col3X + labelWidth, currentY);
    }
    currentY += lineHeight;

    if (formData.Codigo) {
      doc.setFont("helvetica", "bold");
      doc.text("Código:", col1X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Codigo, col1X + labelWidth, currentY);
    }

    if (formData.Modelo) {
      doc.setFont("helvetica", "bold");
      doc.text("Móvil:", col2X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Marca + " " + formData.Modelo, col2X + labelWidth, currentY);
    }
    currentY += lineHeight;

    if (formData.Patron) {
      const patron = formData.Patron.length > 35 ? formData.Patron.substring(0, 33) + ".." : formData.Patron;
      doc.setFont("helvetica", "bold");
      doc.text("Patrón:", col1X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(patron, col1X + labelWidth, currentY);
    }
    currentY += lineHeight;

    if (formData.Costo) {
      doc.setFont("helvetica", "bold");
      doc.text("Costo:", col1X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Costo, col1X + labelWidth, currentY);
    }

    if (formData.Abono) {
      doc.setFont("helvetica", "bold");
      doc.text("Abono:", col2X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Abono, col2X + labelWidth, currentY);
    }

    if (formData.Restante) {
      doc.setFont("helvetica", "bold");
      doc.text("Restante:", col3X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formData.Restante, col3X + labelWidth + 5, currentY);
    }
    currentY += lineHeight;

    const barcodeY = currentY + 5;

    const canvas = document.createElement("canvas");
    const barcodeValue = formId || formData.Codigo || formData.Telefono;
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      width: 1,
      height: 15,
      displayValue: false,
      margin: 0
    });

    const barcodeWidth = width - (margin * 2) - 10;
    const barcodeX = margin + 5;
    doc.addImage(canvas.toDataURL("image/png"), "PNG", barcodeX, barcodeY, barcodeWidth, 15);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const textY = barcodeY + 25;
    const textWidth = doc.getStringUnitWidth(barcodeValue) * 7 / doc.internal.scaleFactor;
    const textX = (width - textWidth) / 2;
    doc.text(barcodeValue, textX, textY);

    return doc;
  };

  const handlePrintLabel = async () => {
    if (!formData.Nombre || !formData.Telefono) {
      setMessage("Por favor, completa los campos obligatorios: Nombre y Teléfono");
      return;
    }

    setIsProcessing((prev) => ({ ...prev, print: true }));
    setMessage("Generando PDF para etiqueta...");

    try {
      const currentDate = new Date().toLocaleDateString("es-ES");
      
      let restante = '';
      if (formData.Costo && formData.Abono) {
        const costo = parseFloat(formData.Costo.replace(/[^\d.-]/g, ''));
        const abono = parseFloat(formData.Abono.replace(/[^\d.-]/g, ''));
        if (!isNaN(costo) && !isNaN(abono)) {
          restante = `$${(costo - abono).toFixed(2)}`;
        }
      }
      
      const updatedFormData = {
        ...formData,
        Fecha: formData.Fecha || currentDate,
        id: formId,
        Patron: pattern.length > 0 ? pattern.join('-') : '',
        Notas: formData.Observaciones,
        Costo: formData.Costo ? (formData.Costo.startsWith('$') ? formData.Costo : `$${formData.Costo}`) : '',
        Abono: formData.Abono ? (formData.Abono.startsWith('$') ? formData.Abono : `$${formData.Abono}`) : '',
        Restante: formData.Restante || restante,
      };

      const doc = generateLabelPDF(updatedFormData);
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        };
      } else {
        throw new Error("No se pudo abrir la ventana de impresión. Verifica que no estén bloqueados los popups.");
      }

      setMessage("Etiqueta generada para impresión con éxito");
    } catch (error: unknown) {
      console.error("Error en impresión de etiqueta:", error);
      setMessage(`Error al generar la etiqueta: ${(error as Error).message || "Desconocido"}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, print: false }));
    }
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
    doc.text(today, titleX, y + 18);
    doc.text(`ID: ${formId}`, titleX + 60, y + 18)

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

    const signatureAreaY = pageHeight - margin - 70;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Información de Recogida:", margin + 5, signatureAreaY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Presentar este comprobante para recoger su dispositivo.", margin + 5, signatureAreaY + 15);

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 5);
    const estimatedDateStr = estimatedDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Fecha estimada de finalización: ${estimatedDateStr}`, margin + 5, signatureAreaY + 22);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    doc.text(
      storeLocation === 'medina' ? "Calle Julián García Sainz de Baranda, S/N" : "Calle Obras Públicas, S/N (Junto a Bar Bilbao)",
      margin + 5,
      signatureAreaY + 28
    );
    doc.text(
      storeLocation === 'medina' ? "09500 Medina de Pomar (Burgos)" : "09550 Villarcayo (Burgos)",
      margin + 5,
      signatureAreaY + 34
    );

    const satData = [
      "Datos del SAT:",
      "Alain Garcia Orive",
      "NIF: 72397028C",
      "c/ Julián García Sainz de Baranda, S/N",
      "09500 Medina de Pomar (Burgos)",
    ];
    const satX = pageWidth - margin;
    let satY = signatureAreaY + 8;
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    satData.forEach((line) => {
      doc.text(line, satX, satY, { align: "right" });
      satY += 5;
    });

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, pageHeight - margin - 8, pageWidth - margin * 2, 4, "F");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`ID: ${formId}`, margin, pageHeight - margin + 3);
    doc.text(today, pageWidth - margin, pageHeight - margin + 3, { align: "right" });
    doc.text("https://www.2sinmovil.es/", pageWidth / 2, pageHeight - margin + 4, { align: "center" });

    const contactAreaY = pageHeight - margin - 25;
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.setFont("helvetica", "normal");
    doc.text("Datos de contacto:", margin + 5, contactAreaY);
    doc.text(
      storeLocation === 'medina' ? "Teléfono: 642 37 24 81" : "Teléfono: 947 62 85 39 / 682 89 81 11",
      margin + 5,
      contactAreaY + 5
    );
    doc.text(
      storeLocation === 'medina' ? "Email: 2sinsidemedina@gmail.com" : "Email: 2sinsidevillarcayo@gmail.com",
      margin + 5,
      contactAreaY + 10
    );

    const qrAreaY = pageHeight - margin - 35;
    doc.addImage(qrcode, "WEBP", pageWidth - margin - 25, qrAreaY, 20, 20);
    doc.setFontSize(6);
    doc.text("Escanea para más información", pageWidth - margin - 15, qrAreaY + 25, { align: "center" });

    doc.addPage();
    y = margin;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Políticas de Servicio", margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.setFont("helvetica", "normal");

    servicePolicies.forEach((policy: string) => {
      if (y + 5 > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
      }
      const lines = doc.splitTextToSize("• " + policy, pageWidth - margin * 2 - 10);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    });

    if (y + 10 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

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
    doc.text(today, titleX, y + 18);

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

    if (y + 20 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Ubicación del Servicio:", margin + 5, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(
      storeLocation === 'medina'
        ? "Medina de Pomar: Calle Julián García Sainz de Baranda, S/N, 09500 (Burgos)"
        : "Villarcayo: Calle Obras Públicas, S/N (Junto a Bar Bilbao), 09550 (Burgos)",
      margin + 5,
      y
    );
    y += 6;
    doc.text(
      storeLocation === 'medina' ? "Teléfono: 642 37 24 81" : "Teléfono: 947 62 85 39 / 682 89 81 11",
      margin + 5,
      y
    );
    y += 6;
    doc.text(
      storeLocation === 'medina' ? "Email: 2sinsidemedina@gmail.com" : "Email: 2sinsidevillarcayo@gmail.com",
      margin + 5,
      y
    );
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Políticas de Servicio", margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.setFont("helvetica", "normal");

    servicePolicies.forEach((policy: string) => {
      if (y + 5 > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
      }
      const lines = doc.splitTextToSize("• " + policy, pageWidth - margin * 2 - 10);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    });

    if (y + 10 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.setFont("helvetica", "italic");
    doc.text("Gracias por confiar en nuestro servicio técnico", pageWidth / 2, pageHeight - 10, { align: "center" });

    return doc;
  };

  const handlePrint = async () => {
    if (!formData.Nombre || !formData.Telefono) {
      setMessage('Por favor, completa los campos obligatorios: Nombre y Teléfono');
      return;
    }
    setIsProcessing((prev) => ({ ...prev, print: true }));
    setMessage('Generando PDF para impresión...');
    try {
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

  const handleSendEmail = async (passedFormId?: string) => {
    if (!formData.Nombre || !formData.Telefono) {
      throw new Error('Por favor, completa los campos obligatorios: Nombre y Teléfono');
    }

    const currentFormId = passedFormId || formId;
    if (!currentFormId) {
      throw new Error('El ID del formulario no está definido');
    }

    setIsProcessing((prev) => ({ ...prev, send: true }));
    setMessage('Enviando PDFs y fotos por correo...');

    try {
      const internalDoc = generateInternalPDF(currentFormId);
      const internalPdfBlob = internalDoc.output('blob');
      const internalPdfBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Error al leer el Blob interno'));
        reader.readAsDataURL(internalPdfBlob);
      });

      const clientDoc = generatePDF(currentFormId);
      const clientPdfBlob = clientDoc.output('blob');
      const clientPdfBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Error al leer el Blob cliente'));
        reader.readAsDataURL(clientPdfBlob);
      });

      const currentDate = new Date().toLocaleDateString("es-ES");
      
      let restante = '';
      if (formData.Costo && formData.Abono) {
        const costo = parseFloat(formData.Costo.replace(/[^\d.-]/g, ''));
        const abono = parseFloat(formData.Abono.replace(/[^\d.-]/g, ''));
        if (!isNaN(costo) && !isNaN(abono)) {
          restante = `$${(costo - abono).toFixed(2)}`;
        }
      }
      
      const updatedFormData = {
        ...formData,
        Fecha: formData.Fecha || currentDate,
        id: currentFormId,
        Patron: pattern.length > 0 ? pattern.join('-') : '',
        Notas: formData.Observaciones,
        Costo: formData.Costo ? (formData.Costo.startsWith('$') ? formData.Costo : `$${formData.Costo}`) : '',
        Abono: formData.Abono ? (formData.Abono.startsWith('$') ? formData.Abono : `$${formData.Abono}`) : '',
        Restante: formData.Restante || restante,
      };
      
      const ticketDoc = generateLabelPDF(updatedFormData);
      const ticketPdfBlob = ticketDoc.output('blob');
      const ticketPdfBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Error al leer el Blob del ticket'));
        reader.readAsDataURL(ticketPdfBlob);
      });

      console.log('Enviando datos:', {
        internalPdfBase64: internalPdfBase64 ? 'Presente' : 'Falta',
        clientPdfBase64: clientPdfBase64 ? 'Presente' : 'Falta',
        ticketPdfBase64: ticketPdfBase64 ? 'Presente' : 'Falta',
        formId: currentFormId || 'Falta'
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internalPdfBase64,
          clientPdfBase64,
          ticketPdfBase64,
          photos,
          formId: currentFormId,
          nombre: formData.Nombre,
          dni: formData.DNI,
          email: formData.Correo,
          marca: formData.Marca,
          modelo: formData.Modelo,
          codigo: formData.Codigo,
          patron: pattern.length > 0 ? pattern.join('-') : '',
          telefono: formData.Telefono,
          storeLocation,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Error del servidor: ${response.status} - ${responseText || 'Sin detalles'}`);
      }

      const result = await response.json();
      setMessage(`PDFs, ticket y fotos enviados por correo con éxito (ID: ${currentFormId})`);
      return result;
    } catch (error: unknown) {
      console.error('Error en envío de correo:', error);
      const errorMessage = (error as Error).message || 'Error desconocido al enviar el correo';
      setMessage(`Error al enviar PDFs, ticket y fotos por correo: ${errorMessage}`);
      throw error;
    } finally {
      setIsProcessing((prev) => ({ ...prev, send: false }));
    }
  };

  const handleSendEmailToClient = async () => {
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

  const handleSendWhatsApp = async () => {
    if (!formData.Nombre || !formData.Telefono) {
      setMessage('Por favor, completa los campos obligatorios: Nombre y Teléfono');
      return;
    }
    setIsProcessing((prev) => ({ ...prev, sendToWhatsApp: true }));
    setMessage('Preparando mensaje para WhatsApp...');
    try {
      const message = `Hola ${formData.Nombre}, aquí tienes el comprobante de tu servicio técnico (ID: ${formId}).\n` +
        `Dispositivo: ${formData.Marca} ${formData.Modelo}\n` +
        `Costo: ${formData.Costo || '0.00'} €\n` +
        `Abono: ${formData.Abono || '0.00'} €\n` +
        `Restante: ${formData.Restante || '0.00'} €\n` +
        `Si deseas el comprobante responde a este mensaje sino has caso omiso\n` +
        `Para más información, visita https://www.2sinmovil.es/`;

      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = formData.Telefono.replace(/\s/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      setMessage(`Mensaje preparado para WhatsApp con éxito (ID: ${formId})`);
    } catch (error: unknown) {
      console.error('Error al preparar WhatsApp:', error);
      setMessage(`Error al preparar el mensaje para WhatsApp: ${(error as Error).message || 'Desconocido'}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, sendToWhatsApp: false }));
    }
  };

  return (
    <div className="form-wrapper">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <form className="form-container" ref={formRef} onSubmit={(e) => e.preventDefault()}>
        <div className="header-container">
          <div className="header-content">
            <h1 className="form-header">Registro de Servicio Técnico</h1>
            <div className="location-selector">
              <label htmlFor="storeLocation">Ubicación:</label>
              <select
                id="storeLocation"
                value={storeLocation}
                onChange={handleLocationChange}
              >
                <option value="medina">Medina de Pomar</option>
                <option value="villarcayo">Villarcayo</option>
              </select>
            </div>
          </div>
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

        <section className="section photos">
          <h2 className="section-title">Fotos del Dispositivo</h2>
          <PhotoCapture onPhotosChange={handlePhotosChange} />
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
          <div className="policies-header">
            <h2 className="section-title">Políticas</h2>
            <button
              type="button"
              className="toggle-policies"
              onClick={() => setIsPoliciesOpen(!isPoliciesOpen)}
            >
              {isPoliciesOpen ? <FaAngleUp /> : <FaAngleDown />}
            </button>
          </div>
          {isPoliciesOpen && (
            <div className="policies-container">
              <ul className="policies-list">
                {servicePolicies.map((policy, index) => (
                  <li key={index}>{policy}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {message && <p className={`submit-message ${message.includes('Error') ? 'error' : ''}`}>{message}</p>}
        {isFinalized ? (
          <PrintComponent
            isProcessing={isProcessing}
            handlePrint={handlePrint}
            handleSendEmail={handleSendEmail}
            handleSendEmailToClient={handleSendEmailToClient}
            handleSendWhatsApp={handleSendWhatsApp}
            handleResetForm={handleResetForm}
            handlePrintLabel={handlePrintLabel}
          />
        ) : (
          <button
            type="button"
            className="finalize-button"
            onClick={handleFinalize}
          >
            Finalizar
          </button>
        )}
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