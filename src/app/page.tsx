"use client";

import LandingLayout from "@/components/landing/LandingLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <LandingLayout>
      <div className="relative w-full overflow-hidden">
        {/* Global Vertical Grid Lines connecting all sections */}
        <div className="absolute top-[-90px] bottom-0 left-[70.5px] w-px bg-cyber-orange/30 hidden md:block z-0 pointer-events-none"></div>
        <div className="absolute top-[-90px] bottom-0 right-[70.5px] w-px bg-cyber-gold/30 hidden md:block z-0 pointer-events-none"></div>

        {/* Hero Section */}
        <section className="relative mt-16.5 pt-32 pb-32 min-h-screen flex flex-col justify-center">
          {/* Corner Accents */}
          <DecorativeLine className="absolute top-[-90px] left-0 right-0 z-20" variant="left-red-right-gold" />

          <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">

            {/* Main Layout Grid */}
            <div className="relative mb-24">
              {/* Title BEHIND the character */}
              <div className="absolute top-[7%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center z-0 pointer-events-none px-4">
                <motion.h1
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-[48px] xs:text-[56px] sm:text-[80px] md:text-[100px] lg:text-[130px] xl:text-[160px] font-bold leading-tight md:leading-none font-orbitron text-white opacity-90 tracking-wider break-words md:whitespace-nowrap"
                >
                  KASPA CLASH
                </motion.h1>
              </div>

              {/* Character Image */}
              <div className="relative z-10 flex justify-center">
                <motion.img
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  src="/assets/hero.webp"
                  alt="Cyberpunk Fighter"
                  className="w-auto h-[300px] sm:h-[400px] md:h-[600px] lg:h-[700px] object-contain drop-shadow-[0_0_30px_rgba(240,183,31,0.3)]"
                />
              </div>

              {/* "True Ownership" - Left Side (Stories & Lore style) */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute top-[40%] left-0 lg:left-10 z-20 hidden md:block max-w-[250px]"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <h3 className="text-xl font-semibold font-orbitron text-white">True Ownership</h3>
                </div>
                <p className="text-cyber-gray text-sm leading-relaxed">
                  Your fighters, your stats, your history. All verifiable on the BlockDAG.
                </p>
              </motion.div>

              {/* "Live Matches" - Right Side (Events style) */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute top-[40%] right-0 lg:right-10 z-20 hidden md:block max-w-[250px] text-right"
              >
                <h3 className="text-xl font-semibold font-orbitron text-white mb-2 leading-tight">
                  LIVE MATCHES<br />AND UPDATES
                </h3>
                <p className="text-cyber-gray text-sm leading-relaxed mb-6">
                  Spectate real-time battles powered by Kaspa's sub-second block times.
                </p>
                <Link href="/spectate">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-gradient-cyber text-white border-0 hover:opacity-90 font-orbitron text-sm px-6 py-2 h-auto rounded-lg">
                      Watch Live
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>

            {/* Bottom Cards Section */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 md:gap-8 items-end relative z-20"
            >

              {/* Left Card - 1 BPS (Experience the Future style) */}
              <motion.div variants={fadeInUp} className="sm:col-span-2 md:col-span-4 lg:col-span-5 relative rounded-[20px] border border-cyber-gold/30 bg-black/40 backdrop-blur-md p-4 sm:p-6 group hover:border-cyber-gold transition-colors">
                <div className="flex gap-3 sm:gap-4 items-center">
                  <img
                    src="/assets/second-hero.webp"
                    alt="Kaspa Speed"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-[12px] object-cover border border-cyber-orange/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyber-gold font-orbitron mb-1">1 BPS</h2>
                    <h3 className="text-white font-medium mb-1 text-sm sm:text-base">Instant Finality</h3>
                    <p className="text-cyber-gray text-xs leading-5 line-clamp-2">
                      Moves confirm in milliseconds. True real-time gaming.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Center Text - Micro Fees (Art & Design style) */}
              <motion.div variants={fadeInUp} className="sm:col-span-2 md:col-span-4 lg:col-span-4 text-center pb-4">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold uppercase mb-2 font-orbitron text-white tracking-widest">
                  MICRO <br /> <span className="text-cyber-orange font-bold">FEES</span>
                </h3>
                <p className="text-cyber-gray text-sm max-w-[200px] mx-auto">
                  Feast your eyes on stunning visuals without paying gas.
                </p>
              </motion.div>

              {/* Right Card - 100% Fair Play (17+ Years style) */}
              <motion.div variants={fadeInUp} className="sm:col-span-2 md:col-span-4 lg:col-span-3">
                <div className="rounded-[20px] border border-cyber-gold/30 bg-black/40 backdrop-blur-md p-6 sm:p-8 text-center h-full flex flex-col justify-center items-center hover:border-cyber-orange transition-colors">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-cyber bg-clip-text text-transparent mb-2 font-orbitron">
                    100%
                  </h2>
                  <p className="text-base sm:text-lg font-medium text-white font-orbitron">
                    Fair Play
                  </p>
                  <p className="text-cyber-gray text-xs mt-2">
                    Verifiable Logic
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Corner Accents */}
          <DecorativeLine className="absolute bottom-[-90px] left-0 right-0 z-20" variant="left-red-right-gold" />

        </section>

        {/* About Section 1 - Neon Dreams */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <div className="container mx-auto px-6 lg:px-12 xl:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeInUp}>
                <h2 className="text-4xl lg:text-[57px] font-bold leading-tight mb-8 font-orbitron">
                  <span className="text-white">Where </span>
                  <span className="bg-gradient-cyber bg-clip-text text-transparent">Skill Meets </span>
                  <span className="text-white">Strategy.</span>
                </h2>
                <p className="text-cyber-gray text-lg leading-8 mb-12">
                  KaspaClash isn't just a game; it's a proving ground. Choose your fighter, master the mechanics, and climb the decentralized leaderboard.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <motion.div variants={fadeInUp}>
                    <h3 className="text-4xl lg:text-[47px] font-semibold bg-gradient-cyber bg-clip-text text-transparent mb-2 font-orbitron">
                      3+
                    </h3>
                    <p className="text-white text-lg">Unique Fighters</p>
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <h3 className="text-4xl lg:text-[47px] font-semibold bg-gradient-cyber bg-clip-text text-transparent mb-2 font-orbitron">
                      P2P
                    </h3>
                    <p className="text-white text-lg">Direct Battles</p>
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <h3 className="text-4xl lg:text-[47px] font-semibold bg-gradient-cyber bg-clip-text text-transparent mb-2 font-orbitron">
                      WASM
                    </h3>
                    <p className="text-white text-lg">High Performance</p>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <img
                  src="/assets/3.webp"
                  alt="Cyberpunk scene"
                  className="w-full h-auto rounded-lg shadow-2xl shadow-cyber-gold/20"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* About Section 2 - Cybernetic Underworld */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <div className="container mx-auto px-6 lg:px-12 xl:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeInUp} className="order-2 lg:order-1">
                <img
                  src="/assets/4.webp"
                  alt="Cyberpunk portrait"
                  className="w-full h-auto rounded-lg shadow-2xl shadow-cyber-orange/20"
                />
              </motion.div>

              <motion.div variants={fadeInUp} className="order-1 lg:order-2">
                <h2 className="text-4xl lg:text-[55px] font-bold leading-tight mb-8 font-orbitron">
                  <span className="text-white">Unveil </span>
                  <span className="bg-gradient-cyber bg-clip-text text-transparent">the Power of </span>
                  <span className="text-white">BlockDAG</span>
                </h2>
                <p className="text-cyber-gray text-lg leading-8 mb-12">
                  Traditional blockchains are too slow for gaming. Kaspa's BlockDAG architecture enables parallel block processing, making it the only PoW chain capable of supporting a real-time fighting game.
                </p>

                {/* Join the Revolution Card */}
                <div className="rounded-[20px] border border-cyber-gold bg-white/[0.04] backdrop-blur-[25.7px] p-8">
                  <div className="flex gap-6 items-start">
                    <img
                      src="/assets/5.webp"
                      alt="Revolution"
                      className="w-48 h-48 rounded-[14px] object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl lg:text-3xl font-medium mb-4 text-white font-orbitron">
                        Join the Fight
                      </h3>
                      <p className="text-cyber-gray text-lg leading-8 mb-4">
                        Connect your wallet and start practicing against AI or challenge real players.
                      </p>
                      <Link href="/matchmaking" className="text-cyber-gold hover:text-cyber-orange font-semibold flex items-center gap-2 transition-colors">
                        Start Playing <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <DecorativeLine className="my-20" variant="left-gold-right-red" />

        {/* Banner Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20 relative"
        >
          <div className="container mx-auto px-6 lg:px-12 xl:px-24">
            <motion.div variants={fadeInUp} className="relative rounded-lg overflow-hidden min-h-[500px] flex items-center">
              {/* Background Image (Generic Scene) */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                style={{ backgroundImage: "url('https://api.builder.io/api/v1/image/assets/TEMP/9919b30c4bdae17fae7a4c7b3ce3e1609b898658?width=1378')" }}
              ></div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-black via-cyber-black/80 to-transparent"></div>

              <div className="relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 lg:px-12">
                  <div className="max-w-2xl">
                    <h2 className="text-4xl lg:text-[68px] font-bold leading-tight mb-8 font-orbitron text-white">
                      Ready to Clash?
                    </h2>
                    <p className="text-cyber-gray text-lg leading-8 mb-8">
                      The arena is open. The blockchain is ready. Join the first wave of fighters and prove your worth on the BlockDAG.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href="/matchmaking">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button size="lg" className="w-full sm:w-auto bg-gradient-cyber text-white border-0 hover:opacity-90 font-orbitron text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto">
                            Play Now
                          </Button>
                        </motion.div>
                      </Link>
                      <Link href="/docs">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="lg" className="w-full sm:w-auto border-cyber-gold text-cyber-gold hover:bg-cyber-gold/10 font-orbitron text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto">
                            Learn More
                          </Button>
                        </motion.div>
                      </Link>
                    </div>
                  </div>

                  {/* Navigation Card */}
                  <div className="hidden lg:block rounded-[20px] border border-cyber-gold bg-black/40 backdrop-blur-xl p-12">
                    <div className="space-y-6">
                      {[
                        { title: "Quick Play", color: "gold", href: "/matchmaking" },
                        { title: "Leaderboard", color: "orange", href: "/leaderboard" },
                        { title: "Docs", color: "gold", href: "/docs" },
                        { title: "Community", color: "orange", href: "#" },
                      ].map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-4 h-4 ${item.color === 'gold' ? 'bg-cyber-gold' : 'bg-cyber-orange'} transform rotate-45 group-hover:rotate-90 transition-transform duration-300`}></div>
                            <span className="text-2xl font-semibold capitalize group-hover:text-cyber-gold transition-colors font-orbitron text-white">
                              {item.title}
                            </span>
                          </div>
                          <div className="rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                            <svg className="w-9 h-9" fill="white" viewBox="0 0 25 24">
                              <path d="M19.799 13.2251L1.44367 13.2251C1.06557 13.2251 0.73043 13.079 0.438257 12.7869C0.146085 12.4947 -1.64197e-06 12.1596 -1.91593e-06 11.7815C-8.62254e-07 11.4033 0.146085 11.0682 0.438257 10.776C0.73043 10.4839 1.06557 10.3378 1.44367 10.3378L19.799 10.3378L11.9619 2.50068C11.6697 2.20851 11.5236 1.86477 11.5236 1.46948C11.5236 1.07419 11.6697 0.730456 11.9619 0.438284C12.2541 0.146111 12.5978 2.48703e-05 12.9931 2.49125e-05C13.3884 2.48809e-05 13.7321 0.146111 14.0243 0.438284L24.3363 10.7503C24.6284 11.0424 24.7745 11.3862 24.7745 11.7815C24.7745 12.1767 24.6284 12.5205 24.3363 12.8127L14.0243 23.1246C13.7321 23.4168 13.3884 23.5629 12.9931 23.5629C12.5978 23.5629 12.2541 23.4168 11.9619 23.1246C11.6697 22.8325 11.5236 22.4887 11.5236 22.0934C11.5236 21.6981 11.6697 21.3544 11.9619 21.0622L19.799 13.2251Z" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <DecorativeLine className="my-20" variant="left-red-right-gold" />

        {/* Services Section (Game Modes) */}
        <motion.section
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <div className="container mx-auto px-6 lg:px-12 xl:px-24">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <motion.h2 variants={fadeInUp} className="text-4xl lg:text-[55px] font-bold leading-tight mb-6 font-orbitron">
                <span className="text-white">Choose Your </span>
                <span className="bg-gradient-cyber bg-clip-text text-transparent">Path</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-cyber-gray text-lg leading-8">
                Whether you're here to train, compete, or spectate, KaspaClash offers multiple ways to engage with the arena.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Quick Match",
                  description: "Jump into the action instantly. Auto-matchmaking pairs you with an opponent of similar skill.",
                  icon: (
                    <svg width="31" height="43" viewBox="0 0 31 43" fill="none">
                      <path d="M17.25 26.8333V15.3333H22.0417V11.5H17.25V0H30.6667V11.5H25.875V15.3333H30.6667V26.8333H17.25ZM0 42.1667V30.6667H4.79167V26.8333H0V15.3333H4.79167V11.5H0V0H13.4167V11.5H8.625V15.3333H13.4167V26.8333H8.625V30.6667H13.4167V42.1667H0Z" fill="url(#paint0_linear)" />
                      <defs>
                        <linearGradient id="paint0_linear" x1="30.6667" y1="37.0676" x2="0" y2="37.0676">
                          <stop stopColor="#F0B71F" />
                          <stop offset="1" stopColor="#E03609" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ),
                },
                {
                  title: "Ranked Play",
                  description: "Compete for KAS and glory. Climb the leaderboard and earn exclusive rewards.",
                  icon: (
                    <svg width="40" height="39" viewBox="0 0 40 39" fill="none">
                      <path d="M33.1583 13.225L39.2917 19.3583L36.6083 22.0417L30.475 15.9083C29.8042 16.2917 29.0854 16.6111 28.3188 16.8667C27.5521 17.1222 26.7375 17.25 25.875 17.25C23.4792 17.25 21.4427 16.4115 19.7656 14.7344C18.0885 13.0573 17.25 11.0208 17.25 8.625C17.25 6.22917 18.0885 4.19271 19.7656 2.51562C21.4427 0.838542 23.4792 0 25.875 0C28.2708 0 30.3073 0.838542 31.9844 2.51562C33.6615 4.19271 34.5 6.22917 34.5 8.625C34.5 9.4875 34.3722 10.3021 34.1167 11.0688C33.8611 11.8354 33.5417 12.5542 33.1583 13.225ZM25.875 13.4167C27.2167 13.4167 28.3507 12.9535 29.2771 12.0271C30.2035 11.1007 30.6667 9.96667 30.6667 8.625C30.6667 7.28333 30.2035 6.14931 29.2771 5.22292C28.3507 4.29653 27.2167 3.83333 25.875 3.83333C24.5333 3.83333 23.3993 4.29653 22.4729 5.22292C21.5465 6.14931 21.0833 7.28333 21.0833 8.625C21.0833 9.96667 21.5465 11.1007 22.4729 12.0271C23.3993 12.9535 24.5333 13.4167 25.875 13.4167ZM3.83333 38.3333C2.77917 38.3333 1.87674 37.958 1.12604 37.2073C0.375347 36.4566 0 35.5542 0 34.5V7.66667C0 6.6125 0.375347 5.71007 1.12604 4.95937C1.87674 4.20868 2.77917 3.83333 3.83333 3.83333H14.375C14.0236 4.63194 13.784 5.45451 13.6563 6.30104C13.5285 7.14757 13.4646 7.98611 13.4646 8.81667C13.4646 12.2986 14.6944 15.2056 17.1542 17.5375C19.6139 19.8694 22.5368 21.0354 25.9229 21.0354C26.5299 21.0354 27.1368 20.9955 27.7438 20.9156C28.3507 20.8358 28.9736 20.7 29.6125 20.5083L34.5 25.3958V34.5C34.5 35.5542 34.1247 36.4566 33.374 37.2073C32.6233 37.958 31.7208 38.3333 30.6667 38.3333H3.83333Z" fill="url(#paint1_linear)" />
                      <defs>
                        <linearGradient id="paint1_linear" x1="39.2917" y1="33.6978" x2="0" y2="33.6978">
                          <stop stopColor="#F0B71F" />
                          <stop offset="1" stopColor="#E03609" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ),
                },
                {
                  title: "Practice Mode",
                  description: "Hone your skills against our advanced AI. No gas fees, no pressure, just pure combat training.",
                  icon: (
                    <svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                      <path d="M3.83333 34.5C3.29028 34.5 2.83507 34.3163 2.46771 33.949C2.10035 33.5816 1.91667 33.1264 1.91667 32.5833V30.6667H0V23C0 22.4569 0.183681 22.0017 0.551042 21.6344C0.918403 21.267 1.37361 21.0833 1.91667 21.0833H3.83333V7.66667C3.83333 5.55833 4.58403 3.75347 6.08542 2.25208C7.58681 0.750695 9.39167 0 11.5 0C13.6083 0 15.4132 0.750695 16.9146 2.25208C18.416 3.75347 19.1667 5.55833 19.1667 7.66667V26.8333C19.1667 27.8875 19.542 28.7899 20.2927 29.5406C21.0434 30.2913 21.9458 30.6667 23 30.6667C24.0542 30.6667 24.9566 30.2913 25.7073 29.5406C26.458 28.7899 26.8333 27.8875 26.8333 26.8333V13.4167H24.9167C24.3736 13.4167 23.9184 13.233 23.551 12.8656C23.1837 12.4983 23 12.0431 23 11.5V3.83333H24.9167V1.91667C24.9167 1.37361 25.1003 0.918403 25.4677 0.551042C25.8351 0.183681 26.2903 0 26.8333 0H30.6667C31.2097 0 31.6649 0.183681 32.0323 0.551042C32.3997 0.918403 32.5833 1.37361 32.5833 1.91667V3.83333H34.5V11.5C34.5 12.0431 34.3163 12.4983 33.949 12.8656C33.5816 13.233 33.1264 13.4167 32.5833 13.4167H30.6667V26.8333C30.6667 28.9417 29.916 30.7465 28.4146 32.2479C26.9132 33.7493 25.1083 34.5 23 34.5C20.8917 34.5 19.0868 33.7493 17.5854 32.2479C16.084 30.7465 15.3333 28.9417 15.3333 26.8333V7.66667C15.3333 6.6125 14.958 5.71007 14.2073 4.95937C13.4566 4.20868 12.5542 3.83333 11.5 3.83333C10.4458 3.83333 9.5434 4.20868 8.79271 4.95937C8.04201 5.71007 7.66667 6.6125 7.66667 7.66667V21.0833H9.58333C10.1264 21.0833 10.5816 21.267 10.949 21.6344C11.3163 22.0017 11.5 22.4569 11.5 23V30.6667H9.58333V32.5833C9.58333 33.1264 9.39965 33.5816 9.03229 33.949C8.66493 34.3163 8.20972 34.5 7.66667 34.5H3.83333Z" fill="url(#paint2_linear)" />
                      <defs>
                        <linearGradient id="paint2_linear" x1="34.5" y1="30.3281" x2="0" y2="30.3281">
                          <stop stopColor="#F0B71F" />
                          <stop offset="1" stopColor="#E03609" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ),
                },
              ].map((service, index) => (
                <motion.div variants={fadeInUp} key={index}>
                  <div className="flex gap-6">
                    <div className="w-20 h-20 rounded-[11px] border-2 border-cyber-gold flex items-center justify-center flex-shrink-0">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl lg:text-3xl font-medium mb-4 text-white font-orbitron">
                        {service.title}
                      </h3>
                      <p className="text-cyber-gray text-lg leading-8">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <DecorativeLine className="my-20" variant="left-gold-right-red" />

        {/* Portal Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <div className="container mx-auto px-6 lg:px-12 xl:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeInUp}>
                <img
                  src="/assets/6.webp"
                  alt="Gritty future"
                  className="w-full h-auto rounded-2xl shadow-2xl shadow-cyber-gold/20"
                />
              </motion.div>

              <motion.div variants={fadeInUp}>
                <h2 className="text-4xl lg:text-[55px] font-bold leading-tight mb-8 font-orbitron">
                  <span className="text-white">Your </span>
                  <span className="bg-gradient-cyber bg-clip-text text-transparent">Portal to</span>
                  <span className="text-white"> Glory</span>
                </h2>
                <p className="text-cyber-gray text-lg leading-8 mb-12">
                  The leaderboard awaits. Every punch, every block, every victory is recorded eternally on the BlockDAG. Will you be remembered?
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/leaderboard">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="w-full sm:w-auto bg-gradient-cyber text-white border-0 hover:opacity-90 font-orbitron text-base sm:text-lg px-6 py-3 h-auto">
                        View Leaderboard
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/docs">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="lg" className="w-full sm:w-auto border-cyber-gold text-cyber-gold hover:bg-cyber-gold/10 font-orbitron text-base sm:text-lg px-6 py-3 h-auto">
                        Game Manual
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <DecorativeLine className="my-20" variant="left-gold-right-red" />

        {/* FAQs Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <div className="container mx-auto px-6 lg:px-12 xl:px-24">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <motion.h2 variants={fadeInUp} className="text-4xl lg:text-[55px] font-bold leading-tight mb-6 font-orbitron">
                <span className="text-white">Frequently Asked </span>
                <span className="bg-gradient-cyber bg-clip-text text-transparent">Questions</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-cyber-gray text-lg leading-8">
                Everything you need to know about the first Kaspa-native fighting game.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  number: "01.",
                  question: "What makes KaspaClash special?",
                  answer: "KaspaClash is the first fighting game to run fully on a Proof-of-Work blockchain (Kaspa) in real-time, thanks to its unique BlockDAG architecture and sub-second block times."
                },
                {
                  number: "02.",
                  question: "Do I need a wallet to play?",
                  answer: "For Practice Mode, no wallet is required. For Ranked and Quick Matches, you need a Kaspa-compatible wallet (like Kaspium or Kasware) to sign transactions."
                },
                {
                  number: "03.",
                  question: "Are transaction fees high?",
                  answer: "Not at all. Kaspa's fees are microscopic. A full match with dozens of moves costs fractions of a penny."
                },
                {
                  number: "04.",
                  question: "Is it really on-chain?",
                  answer: "Yes. Every move is hashed and submitted to the leaderboard. You can verify every single punch and kick on the Kaspa explorer."
                },
              ].map((faq, index) => (
                <motion.div variants={fadeInUp} key={index} className="pb-8 border-b border-gradient-cyber-270">
                  <div className="flex gap-6">
                    <span className="text-5xl font-medium bg-gradient-cyber bg-clip-text text-transparent leading-tight font-orbitron">
                      {faq.number}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-4 text-white font-orbitron">
                        {faq.question}
                      </h3>
                      <p className="text-cyber-gray text-lg leading-8">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <DecorativeLine className="my-20" variant="left-gold-right-red" />
      </div>
    </LandingLayout>
  );
}
