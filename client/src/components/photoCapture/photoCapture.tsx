import { useRef, useState, useEffect } from 'react';
import { 
  BsCameraFill, 
  BsCameraVideoOffFill, 
  BsZoomIn, 
  BsZoomOut, 
  BsFillGridFill,
  BsLightbulbFill,
  BsLightbulbOffFill,
  BsGearFill,
  BsTrashFill,
  BsCameraReelsFill,
  BsDownload
} from 'react-icons/bs';
import './photoCapture.css';

interface PhotoCaptureProps {
  onPhotosChange: (photos: string[]) => void;
  aspectRatio?: "4:3" | "16:9" | "1:1";
  maxPhotos?: number;
  quality?: number;
}

function PhotoCapture({ 
  onPhotosChange, 
  aspectRatio = "4:3", 
  maxPhotos = 10, 
  quality = 0.8 
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error al enumerar dispositivos:', error);
    }
  };

  useEffect(() => {
    enumerateDevices();
  }, []);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ zoom: zoomLevel }]
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.zoom) {
            try {
              const settings = videoTrack.getSettings();
              const constraints = {};
              if (capabilities.zoom) {
                Object.assign(constraints, { zoom: zoomLevel });
              }
              if (capabilities.torch && flashMode) {
                Object.assign(constraints, { torch: flashMode });
              }
              await videoTrack.applyConstraints(constraints);
            } catch (error) {
              console.error('Error al aplicar restricciones:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Verifique los permisos e inténtelo de nuevo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    if (cameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 300);
    }
  };

  const increaseZoom = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 3);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  const decreaseZoom = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 1);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  const applyZoom = async (zoom: number) => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.zoom) {
        try {
          await videoTrack.applyConstraints({ advanced: [{ zoom }] });
        } catch (error) {
          console.error('Error al aplicar zoom:', error);
        }
      }
    }
  };

  const toggleFlash = async () => {
    const newFlashMode = !flashMode;
    setFlashMode(newFlashMode);
    
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        try {
          await videoTrack.applyConstraints({ advanced: [{ torch: newFlashMode }] });
        } catch (error) {
          console.error('Error al controlar el flash:', error);
        }
      } else {
        console.warn('El flash no está disponible en este dispositivo');
      }
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0);
    
    if (showGrid) {
      drawGrid(context, canvasRef.current.width, canvasRef.current.height);
    }
    
    const photoData = canvasRef.current.toDataURL('image/jpeg', quality);
    const base64Data = photoData.split(',')[1];
    
    if (photos.length < maxPhotos) {
      const newPhotos = [...photos, base64Data];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
      
      const flashElement = document.createElement('div');
      flashElement.className = 'camera-flash';
      document.querySelector('.photo-capture-container')?.appendChild(flashElement);
      setTimeout(() => flashElement.remove(), 300);
    } else {
      alert(`Has alcanzado el límite máximo de ${maxPhotos} fotos.`);
    }
  };

  const drawGrid = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 1;
    
    for (let i = 1; i < 3; i++) {
      context.beginPath();
      context.moveTo(0, height * (i / 3));
      context.lineTo(width, height * (i / 3));
      context.stroke();
    }
    
    for (let i = 1; i < 3; i++) {
      context.beginPath();
      context.moveTo(width * (i / 3), 0);
      context.lineTo(width * (i / 3), height);
      context.stroke();
    }
  };

  const deletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
    setSelectedPhotoIndex(null);
  };

  const downloadPhoto = (index: number) => {
    const photoData = `data:image/jpeg;base64,${photos[index]}`;
    const link = document.createElement('a');
    link.href = photoData;
    link.download = `photo_${new Date().toISOString().replace(/:/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera]);

  return (
    <div className="photo-capture-container">
      <div className="video-container" data-aspect-ratio={aspectRatio}>
        <video 
          ref={videoRef} 
          className="video-element"
          playsInline
        />
        
        {!cameraActive && (
          <div className="camera-off-overlay">
            <BsCameraVideoOffFill size={64} className="camera-off-icon" />
            <p className="camera-off-text">Cámara desactivada</p>
          </div>
        )}
        
        {showGrid && cameraActive && (
          <div className="grid-overlay">
            <div className="grid-line horizontal top-third"></div>
            <div className="grid-line horizontal bottom-third"></div>
            <div className="grid-line vertical left-third"></div>
            <div className="grid-line vertical right-third"></div>
          </div>
        )}
        
        {cameraActive && (
          <div className="camera-status">
            <div className="status-indicator">
              <span className="recording-dot"></span>
              <span className="status-text">REC</span>
            </div>
            <div className="zoom-indicator">
              {zoomLevel.toFixed(1)}x
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="camera-controls">
        <div className="left-controls">
          <button
            className="control-btn settings-btn"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            title="Configuración"
          >
            <BsGearFill size={20} />
          </button>
          
          <button
            className={`control-btn grid-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
          >
            <BsFillGridFill size={20} />
          </button>
          
          <button
            className={`control-btn flash-btn ${flashMode ? 'active' : ''}`}
            onClick={toggleFlash}
            title={flashMode ? "Apagar flash" : "Encender flash"}
            disabled={!cameraActive}
          >
            {flashMode ? (
              <BsLightbulbFill size={20} />
            ) : (
              <BsLightbulbOffFill size={20} />
            )}
          </button>
        </div>
        
        <div className="center-controls">
          <button
            className={`capture-btn ${!cameraActive ? "disabled" : ""}`}
            onClick={takePhoto}
            disabled={!cameraActive || photos.length >= maxPhotos}
            title="Tomar foto"
          >
            <BsCameraFill size={28} />
          </button>
        </div>
        
        <div className="right-controls">
          <button
            className="control-btn zoom-out-btn"
            onClick={decreaseZoom}
            disabled={!cameraActive || zoomLevel <= 1}
            title="Reducir zoom"
          >
            <BsZoomOut size={20} />
          </button>
          
          <button
            className="control-btn zoom-in-btn"
            onClick={increaseZoom}
            disabled={!cameraActive || zoomLevel >= 3}
            title="Aumentar zoom"
          >
            <BsZoomIn size={20} />
          </button>
          
          <button
            className="control-btn switch-camera-btn"
            onClick={switchCamera}
            title="Cambiar cámara"
          >
            <BsCameraReelsFill size={20} />
          </button>
          
          <button
            className={`control-btn toggle-camera-btn ${cameraActive ? "active" : ""}`}
            onClick={toggleCamera}
            title={cameraActive ? "Apagar cámara" : "Encender cámara"}
          >
            {cameraActive ? (
              <BsCameraFill size={20} />
            ) : (
              <BsCameraVideoOffFill size={20} />
            )}
          </button>
        </div>
      </div>
      
      {showSettingsPanel && (
        <div className="settings-panel">
          <h3 className="settings-title">Configuración</h3>
          
          <div className="settings-group">
            <label className="settings-label">Cámara:</label>
            <select 
              className="settings-select"
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
            >
              {availableCameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Cámara ${camera.deviceId.substr(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="settings-group">
            <label className="settings-label">Zoom ({zoomLevel.toFixed(1)}x):</label>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.1" 
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="settings-range"
            />
          </div>
        </div>
      )}
      
      {photos.length > 0 && (
        <div className="photos-gallery">
          <div className="gallery-header">
            <h3 className="gallery-title">Fotos capturadas ({photos.length}/{maxPhotos})</h3>
            {selectedPhotoIndex !== null && (
              <div className="gallery-actions">
                <button 
                  className="action-btn delete-btn" 
                  onClick={() => deletePhoto(selectedPhotoIndex)}
                  title="Eliminar foto"
                >
                  <BsTrashFill size={18} />
                </button>
                <button 
                  className="action-btn download-btn" 
                  onClick={() => downloadPhoto(selectedPhotoIndex)}
                  title="Descargar foto"
                >
                  <BsDownload size={18} />
                </button>
              </div>
            )}
          </div>
          
          <div className="photos-grid">
            {photos.map((photo, index) => (
              <div 
                key={index}
                className={`photo-item ${selectedPhotoIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedPhotoIndex(index)}
              >
                <img
                  src={`data:image/jpeg;base64,${photo}`}
                  alt={`Foto ${index + 1}`}
                  className="photo-image"
                />
                <div className="photo-number">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoCapture;