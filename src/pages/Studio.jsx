import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "../components/ui/Reveal";
import "./Studio.css";
import { ArrowLeft } from "@phosphor-icons/react";
export function Studio() {
    const { t } = useLanguage();
    return (
        <div className="studio-page">
            <div className="studio-page__hero">
                <div className="container">
                    <Link to="/" className="back-link">
                        <ArrowLeft weight="bold" />
                        <span>Back</span>
                    </Link>
                    <Reveal>
                        <h1>{t("studio.title")}</h1>
                        <p>{t("studio.body")}</p>
                    </Reveal>
                </div>
            </div>
            <section className="container studio-page__grid">
                <Reveal>
                    <article>
                        <h2>{t("studio.vision")}</h2>
                        <p>{t("studio.visionCopy")}</p>
                    </article>
                </Reveal>
                <Reveal delay={100}>
                    <article>
                        <h2>{t("studio.craft")}</h2>
                        <p>{t("studio.craftCopy")}</p>
                    </article>
                </Reveal>
            </section>
            <section className="studio-page__quote">
                <Reveal>
                    <p>“We don't make safe worlds.”</p>
                </Reveal>
            </section>
        </div>
    );
}
