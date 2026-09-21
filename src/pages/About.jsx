import { Reveal } from "../components/ui/Reveal";
import { Link } from "react-router-dom";
export function About() {
    return (
        <div className="studio-page">
            <div className="studio-page__hero">
                <div className="container">
                    <Reveal>
                            <h1>Deadsmile Games</h1>
                            <p>Deadsmile Games was founded by Lucas Eduardo Duarte Pereira with a simple idea: build games that become part of people's lives, not just something they finish and forget.</p>
                    </Reveal>
                </div>
            </div>
            <section className="container studio-page__story">
                <Reveal>
                    <p>What started as a personal vision became a studio focused on worlds with feeling, challenge and memory. Deadsmile exists to create games that players carry with them: stories they talk about, mechanics they learn deeply, and moments that feel personal.</p>
                    <p>The studio is led by people: the fans, players and community around each project. Their feedback, patience, theories and love for the games shape what Deadsmile becomes next.</p>
                </Reveal>
            </section>
            <section className="container studio-page__grid">
                <Reveal>
                    <article>
                        <h2>Built around presence</h2>
                        <p>We care about atmosphere, character and systems that invite players to return. A Deadsmile game should feel like a place you remember.</p>
                    </article>
                </Reveal>
                <Reveal delay={100}>
                    <article>
                        <h2>Led by the community</h2>
                        <p>Fans are not just an audience at the end of production. They are the people who help the studio understand what matters, what works and what deserves to grow.</p>
                    </article>
                </Reveal>
            </section>
            <section className="container studio-page__closing">
                <Reveal>
                    <h2>Small studio, long memory.</h2>
                    <p>The goal is not to chase every trend. The goal is to build games with enough honesty and craft that someone can find them at the right time and feel like they mattered.</p>
                    <Link className="btn btn--primary" to="/games">Explore the games</Link>
                </Reveal>
            </section>
        </div>
    );
}
