import { useEffect, useRef, useState } from "react";
import "pannellum";
import "pannellum/build/pannellum.css";
import "./VirtualTourViewer.css";

function VirtualTourViewer({ scenes, title }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const availableScenes = Array.isArray(scenes)
    ? scenes.filter((scene) => scene.id && typeof scene.panorama === "string" && scene.panorama.trim())
    : [];
  const hasValidScenes = availableScenes.length > 0;
  const [currentSceneId, setCurrentSceneId] = useState(availableScenes[0]?.id || "");
  const [status, setStatus] = useState(hasValidScenes ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState(
    hasValidScenes ? "" : "لا تتوفر صور بانورامية صالحة لهذه الجولة.",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const validScenes = (Array.isArray(scenes) ? scenes : []).filter((scene) => {
      const isValid = scene.id && typeof scene.panorama === "string" && scene.panorama.trim();
      if (!isValid) {
        console.error("Virtual tour scene is missing an ID or panorama image.", scene);
      }
      return isValid;
    });
    if (!validScenes.length) {
      console.error("Virtual tour has no scenes with panorama images.");
      return undefined;
    }

    const sceneIds = new Set(validScenes.map((scene) => scene.id));
    const firstSceneId = validScenes[0].id;
    const pannellumScenes = Object.fromEntries(
      validScenes.map((scene) => [
        scene.id,
        {
          type: "equirectangular",
          panorama: scene.panorama,
          hotSpots: (scene.hotspots || [])
            .filter((hotspot) => {
              const isValid = sceneIds.has(hotspot.targetSceneId);
              if (!isValid) {
                console.error(
                  `Virtual tour hotspot in "${scene.id}" references missing scene "${hotspot.targetSceneId}".`,
                );
              }
              return isValid;
            })
            .map((hotspot) => ({
              pitch: hotspot.pitch,
              yaw: hotspot.yaw,
              type: "scene",
              sceneId: hotspot.targetSceneId,
              cssClass: "virtual-tour-scene-arrow",
              text: hotspot.label,
            })),
        },
      ]),
    );

    let viewer;
    let cancelled = false;
    try {
      viewer = window.pannellum.viewer(container, {
        default: {
          firstScene: firstSceneId,
          autoLoad: true,
          showControls: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          mouseZoom: true,
          minHfov: 50,
          maxHfov: 120,
          hfov: 100,
          sceneFadeDuration: 800,
        },
        scenes: pannellumScenes,
      });
    } catch (error) {
      console.error("Unable to initialize the Pannellum virtual tour.", error);
      queueMicrotask(() => {
        if (cancelled) return;
        setErrorMessage("تعذر تهيئة عارض الجولة الافتراضية.");
        setStatus("error");
      });
      return () => {
        cancelled = true;
      };
    }

    viewerRef.current = viewer;

    const handleSceneChange = (sceneId) => {
      setCurrentSceneId(sceneId);
      setStatus("loading");
      setErrorMessage("");
    };
    const handleLoad = () => {
      setStatus("ready");
      setErrorMessage("");
    };
    const handleError = (message) => {
      console.error("Unable to load a virtual tour panorama.", message);
      setErrorMessage("تعذر تحميل هذه الصورة البانورامية. تحقق من الملف وحاول اختيار غرفة أخرى.");
      setStatus("error");
    };

    viewer.on("scenechange", handleSceneChange);
    viewer.on("load", handleLoad);
    viewer.on("error", handleError);

    return () => {
      if (viewerRef.current === viewer) viewerRef.current = null;
      viewer.destroy();
    };
  }, [scenes]);

  const currentScene = availableScenes.find((scene) => scene.id === currentSceneId);
  const displayedStatus = hasValidScenes ? status : "error";
  const displayedErrorMessage = hasValidScenes
    ? errorMessage
    : "لا تتوفر صور بانورامية صالحة لهذه الجولة.";

  const changeZoom = (amount) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.setHfov(Math.max(50, Math.min(120, viewer.getHfov() + amount)), 250);
  };

  const toggleFullscreen = () => {
    viewerRef.current?.toggleFullscreen();
  };

  const loadScene = (sceneId) => {
    viewerRef.current?.loadScene(sceneId);
  };

  return (
    <section className="virtual-tour" aria-label={`جولة افتراضية داخل ${title}`}>
      <div className="virtual-tour-toolbar">
        <span className="virtual-tour-badge">360° جولة افتراضية</span>
        <nav className="virtual-tour-rooms" aria-label="اختر غرفة">
          {availableScenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={`virtual-tour-room${scene.id === currentSceneId ? " is-active" : ""}`}
              aria-pressed={scene.id === currentSceneId}
              onClick={() => loadScene(scene.id)}
            >
              {scene.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="virtual-tour-stage">
        <div
          className="virtual-tour-pannellum"
          ref={containerRef}
          aria-label={currentScene?.label || "مشهد الجولة الافتراضية"}
        />

        {displayedStatus === "loading" && (
          <div className="virtual-tour-status" role="status" aria-live="polite">
            <span className="virtual-tour-spinner" />
            <span>جاري تحميل {currentScene?.label || "المشهد"}...</span>
          </div>
        )}
        {displayedStatus === "error" && (
          <div className="virtual-tour-status virtual-tour-status-error" role="alert">
            <strong>تعذر عرض المشهد</strong>
            <span>{displayedErrorMessage}</span>
          </div>
        )}

        <div className="virtual-tour-controls" aria-label="أدوات العرض">
          <button type="button" onClick={() => changeZoom(-10)} aria-label="تكبير">+</button>
          <button type="button" onClick={() => changeZoom(10)} aria-label="تصغير">−</button>
          <button type="button" onClick={toggleFullscreen} aria-label="ملء الشاشة" title="ملء الشاشة">
            ⛶
          </button>
        </div>

        {currentScene?.attribution && (
          <a
            className="virtual-tour-credit"
            href={currentScene.attributionUrl}
            target="_blank"
            rel="noreferrer"
            title="مصدر الصورة والترخيص"
          >
            {currentScene.attribution}
          </a>
        )}
      </div>
    </section>
  );
}

export default VirtualTourViewer;
