import React, { useEffect, useState } from "react";
import api from "../../api";
import FadeInSection from "../../components/ui/FadeInSection";
import "./LegalPages.css";

export default function SizeChartPage() {
  const [sizeChartUrl, setSizeChartUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchSizeChart = async () => {
      try {
        const res = await api.get("/api/catalog/overrides");
        const overrides = res.data?.overrides || [];
        const sizeConfig = overrides.find(
          (o) => o.tab_key === "system" && o.product_id === "size_chart"
        );
        if (mounted && sizeConfig?.images?.[0]) {
          setSizeChartUrl(sizeConfig.images[0]);
        }
      } catch (e) {
        console.error("Failed to fetch size chart:", e);
      }
    };
    fetchSizeChart();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="legal-page size-chart-page">
      <FadeInSection className="legal-hero">
        <h1>Size Chart</h1>
        <p className="legal-intro">
          Find the right fit for your BMSCE Merch. Measure yourself and compare with the chart below.
        </p>
      </FadeInSection>

      <FadeInSection className="legal-section size-chart-section">
        {sizeChartUrl ? (
          <div className="size-chart-image-wrap">
            <img
              src={sizeChartUrl}
              alt="Size Chart"
              className="size-chart-image"
            />
          </div>
        ) : (
          <div className="size-chart-placeholder">
            <p>Size chart image will be added soon. Check back later or contact us for sizing help.</p>
            <a href="mailto:souparno.cs24@bmsce.ac.in">Contact us for sizing assistance</a>
          </div>
        )}
      </FadeInSection>
    </div>
  );
}
