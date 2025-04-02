import React from 'react';
import { FaPrint, FaEnvelope, FaWhatsapp, FaRedo } from 'react-icons/fa';
import './PrintComponent.css';

interface ProcessingState {
    print: boolean;
    send: boolean;
    sendToClient: boolean;
    sendToWhatsApp: boolean;
}

interface PrintComponentProps {
    isProcessing: ProcessingState;
    handlePrint: () => void;
    handleSendEmail: () => void;
    handleSendEmailToClient: () => void;
    handleSendWhatsApp: () => void;
    handlePrintLabel: () => void;
    handleResetForm: () => void;
}

const PrintComponent: React.FC<PrintComponentProps> = ({
    isProcessing,
    handlePrint,
    handleSendEmailToClient,
    handleSendWhatsApp,
    handlePrintLabel,
    handleResetForm,
}) => {
    return (
        <div className="container">
            <div className="button-grid">
                <button
                    type="button"
                    className="button blue"
                    onClick={handlePrint}
                    disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient || isProcessing.sendToWhatsApp}
                >
                    <FaPrint /> {isProcessing.print ? 'Imprimiendo...' : 'Imprimir'}
                </button>
                <button
                    type="button"
                    className="button green"
                    onClick={handleSendEmailToClient}
                    disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient || isProcessing.sendToWhatsApp}
                >
                    <FaEnvelope /> {isProcessing.sendToClient ? 'Enviando...' : 'Correo al Cliente'}
                </button>
                <button
                    type="button"
                    className="button whatsapp"
                    onClick={handleSendWhatsApp}
                    disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient || isProcessing.sendToWhatsApp}
                >
                    <FaWhatsapp /> {isProcessing.sendToWhatsApp ? 'Preparando...' : 'WhatsApp'}
                </button>
                <button
                    type="button"
                    className="button purple"
                    onClick={handlePrintLabel}
                    disabled={isProcessing.print}
                >
                    <FaPrint /> {isProcessing.print ? 'Imprimiendo...' : 'Etiqueta'}
                </button>
            </div>
            <button
                type="button"
                className="button red"
                onClick={handleResetForm}
                disabled={isProcessing.print || isProcessing.send || isProcessing.sendToClient}
            >
                <FaRedo /> Limpiar Formulario
            </button>
        </div>
    );
};

export default PrintComponent;