"use client";

import React, { useEffect, useRef } from "react";

/**
 * 3D Rotating Earth Globe Widget for the bottom-left corner of the N.E.X.U.S. HUD.
 * Features rotating latitude/longitude wireframe, continent coordinate point clouds,
 * glowing atmospheric halo, and orbital telemetry data.
 */
export default function EarthGlobeWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotationAngle = 0;

    // Generate fixed spherical coordinates for continent landmass dots
    const NUM_POINTS = 220;
    const points: { phi: number; theta: number; isMajor: boolean }[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      // Golden spiral distribution on sphere
      const y = 1 - (i / (NUM_POINTS - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = i * 2.3999632; // golden angle
      points.push({
        phi: Math.acos(y),
        theta,
        isMajor: i % 4 === 0,
      });
    }

    const radius = 38; // Radius of mini globe
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rotationAngle += 0.012; // Stable, smooth rotation

      // 1. Atmosphere Outer Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.3);
      glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.22)");
      glowGrad.addColorStop(0.7, "rgba(0, 150, 255, 0.08)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Earth Sphere Base
      const sphereGrad = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, radius);
      sphereGrad.addColorStop(0, "rgba(4, 30, 60, 0.85)");
      sphereGrad.addColorStop(0.8, "rgba(2, 12, 28, 0.95)");
      sphereGrad.addColorStop(1, "rgba(0, 229, 255, 0.3)");
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Globe Perimeter Wire
      ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4. Rotating Latitude & Longitude Rings
      const latOffsets = [-0.5, 0, 0.5];
      latOffsets.forEach((lat) => {
        const rLat = radius * Math.cos(lat);
        const yLat = cy + radius * Math.sin(lat);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
        ctx.beginPath();
        ctx.ellipse(cx, yLat, rLat, rLat * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Rotating Meridians (4 rotating longitudinal ellipses)
      for (let m = 0; m < 4; m++) {
        const mAngle = rotationAngle + (m * Math.PI) / 4;
        const xStretch = Math.cos(mAngle);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.18)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(xStretch) * radius, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Rotating Continent Point Cloud (3D -> 2D projection)
      points.forEach((pt) => {
        const rotTheta = pt.theta + rotationAngle;
        const x3D = Math.sin(pt.phi) * Math.cos(rotTheta);
        const y3D = Math.cos(pt.phi);
        const z3D = Math.sin(pt.phi) * Math.sin(rotTheta);

        // Only render points on the visible front hemisphere (z3D > -0.15)
        if (z3D > -0.15) {
          const px = cx + x3D * radius;
          const py = cy + y3D * radius * 0.95;
          const depthAlpha = Math.max(0.15, (z3D + 0.15) / 1.15);

          ctx.fillStyle = pt.isMajor
            ? `rgba(0, 229, 255, ${depthAlpha * 0.9})`
            : `rgba(56, 189, 248, ${depthAlpha * 0.55})`;
          ctx.beginPath();
          ctx.arc(px, py, pt.isMajor ? 1.4 : 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Orbital Satellite Ping
      const orbitAngle = rotationAngle * 1.8;
      const satX = cx + Math.cos(orbitAngle) * (radius + 8);
      const satY = cy + Math.sin(orbitAngle) * (radius + 8) * 0.38;

      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(satX, satY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Satellite glow pulse
      ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(satX, satY, 5 + Math.sin(rotationAngle * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="hud-earth-widget">
      <div className="earth-canvas-wrapper">
        <canvas ref={canvasRef} width={100} height={100} className="earth-canvas" />
        <div className="earth-radar-sweep" />
      </div>
      <div className="earth-telemetry">
        <div className="earth-telemetry-title">
          <span className="earth-pulse" />
          GEO-ROTATION TELEMETRY
        </div>
        <div className="earth-telemetry-row">
          <span className="telemetry-label">AXIS:</span>
          <span className="telemetry-value">23.44° STABLE</span>
        </div>
        <div className="earth-telemetry-row">
          <span className="telemetry-label">ROTATION:</span>
          <span className="telemetry-value">15.04°/HR</span>
        </div>
        <div className="earth-telemetry-row">
          <span className="telemetry-label">SYS LOC:</span>
          <span className="telemetry-value">18.52° N, 73.85° E</span>
        </div>
      </div>
    </div>
  );
}
