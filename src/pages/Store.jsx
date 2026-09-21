import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { Reveal } from "../components/ui/Reveal";
import { ArrowLeft } from "@phosphor-icons/react";
import { safeImageUrl } from "../utils/urls";
export function Store() {
    const { t } = useLanguage();
    const data = useContent("/products");
    return (
        <div className="media-page container">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>
            <Reveal>
                <h1>{t("media.store")}</h1>
                <p className="media-page__intro">{t("media.storeIntro")}</p>
            </Reveal>
            <div className="store-grid">
                {data.status === "loading" && <p>Loading…</p>}
                {data.status === "error" && <p>{data.error}</p>}
                {data.data.length === 0 && data.status === "success" && (
                    <p>{t("media.coming")}</p>
                )}
                {data.data.map((item, i) => (
                    <Reveal key={item.id} delay={i * 60}>
                        <article>
                            <div className="store-grid__visual">
                                {safeImageUrl(item.image) && (
                                    <img
                                        src={safeImageUrl(item.image)}
                                        alt=""
                                        loading="lazy"
                                    />
                                )}
                            </div>
                            <div>
                                <small>{item.category}</small>
                                <h2>{item.name}</h2>
                                <p>
                                    R${" "}
                                    {(item.price_cents / 100)
                                        .toFixed(2)
                                        .replace(".", ",")}
                                </p>
                            </div>
                        </article>
                    </Reveal>
                ))}
            </div>
        </div>
    );
}
