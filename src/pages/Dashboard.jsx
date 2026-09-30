import { useEffect, useState } from "react";
import { Typography } from "antd";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import active from "../assets/active.png";

const { Title, Text } = Typography;

export const Dashboard = () => {
  const [userName, setUserName] = useState("Пользователь");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-500, 500], [4, -4]);
  const rotateY = useTransform(mouseX, [-500, 500], [-4, 4]);

  const smoothRotateX = useSpring(rotateX, {
    stiffness: 100,
    damping: 20,
  });

  const smoothRotateY = useSpring(rotateY, {
    stiffness: 100,
    damping: 20,
  });

  // Получение имени и фамилии пользователя
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");

      if (userStr) {
        const userObj = JSON.parse(userStr);

        const firstName = userObj.firstName || "";
        const lastName = userObj.lastName || "";

        const fullName = `${firstName} ${lastName}`.trim();

        setUserName(
          fullName ||
            userObj.userName ||
            userObj.name ||
            userObj.login ||
            "Пользователь",
        );
      }
    } catch (e) {
      console.error("Ошибка чтения данных пользователя:", e);
    }
  }, []);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        minHeight: "100vh",
        padding: "35px 20px 60px",
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(135deg, #ffffff 0%, #fffafa 45%, #faf7ff 100%)",
      }}
    >
      {/* Декоративные свечения */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.35, 0.5, 0.35],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.16), transparent 70%)",
          top: -100,
          left: -100,
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.4, 0.25],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.14), transparent 70%)",
          right: -120,
          bottom: -100,
          pointerEvents: "none",
        }}
      />

      {/* Заголовок */}
      <motion.div
        initial={{
          opacity: 0,
          y: -40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
        }}
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Title
          level={1}
          style={{
            margin: 0,
            fontSize: "clamp(34px, 5vw, 60px)",
            fontWeight: 900,
            lineHeight: 1.1,
            background:
              "linear-gradient(90deg, #ef4444 0%, #f00 30%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Добро пожаловать
        </Title>
      </motion.div>

      {/* Имя пользователя */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.4,
          duration: 0.7,
        }}
        style={{
          textAlign: "center",
          marginTop: 12,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Title
          level={2}
          style={{
            margin: 10,
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 800,
            background:
              "linear-gradient(90deg, #ef4444 0%, #f00 30%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {userName}
        </Title>

        <Text
          style={{
            fontSize: "clamp(20px, 3vw, 30px)",
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          В базу знаний
        </Text>
      </motion.div>

      {/* Декоративная линия */}
      <motion.div
        initial={{
          width: 0,
          opacity: 0,
        }}
        animate={{
          width: 120,
          opacity: 1,
        }}
        transition={{
          delay: 0.7,
          duration: 0.8,
        }}
        style={{
          height: 4,
          margin: "18px auto 32px",
          borderRadius: 20,
          background: "linear-gradient(90deg, #ef4444, #ec4899, #8b5cf6)",
          boxShadow: "0 4px 18px rgba(239,68,68,0.25)",
        }}
      />

      {/* Card + Image */}
      <motion.div
        initial={{
          opacity: 0,
          y: 50,
          scale: 0.94,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          delay: 0.8,
          duration: 1,
          ease: "easeOut",
        }}
        style={{
          perspective: 1400,
          display: "flex",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <motion.div
          style={{
            rotateX: smoothRotateX,
            rotateY: smoothRotateY,
            width: "100%",
            maxWidth: 1250,
          }}
        >
          <motion.div
            animate={{
              y: [0, -7, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "relative",
              padding: 8,
              borderRadius: 32,
              background: "linear-gradient(135deg, #ffffff, #fdf7f8, #f8f5ff)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow:
                "0 35px 90px rgba(15,23,42,0.13), 0 10px 35px rgba(239,68,68,0.08)",
            }}
          >
            {/* Градиентная верхняя линия */}
            <div
              style={{
                position: "absolute",
                top: -2,
                left: "18%",
                right: "18%",
                height: 5,
                borderRadius: 20,
                background: "linear-gradient(90deg, #ef4444, #ec4899, #8b5cf6)",
                boxShadow: "0 0 25px rgba(239,68,68,0.45)",
                zIndex: 5,
              }}
            />

            {/* Внешнее свечение */}
            <div
              style={{
                position: "absolute",
                inset: 35,
                borderRadius: 30,
                background:
                  "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(236,72,153,0.08), rgba(139,92,246,0.12))",
                filter: "blur(30px)",
                zIndex: -1,
              }}
            />

            {/* Внутренняя карточка */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 26,
                background: "#ffffff",
                border: "1px solid rgba(226,232,240,0.8)",
              }}
            >
              {/* Верхний свет */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 90,
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              <motion.img
                src={active}
                alt="База знаний"
                whileHover={{
                  scale: 1.015,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                }}
                style={{
                  display: "block",
                  width: "100%",
                  height: "600px",
                  objectFit: "contain",
                }}
              />

              {/* Нижний мягкий градиент */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 100,
                  background:
                    "linear-gradient(to top, rgba(255,255,255,0.75), transparent)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Нижняя подпись */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 1.2,
          duration: 0.7,
        }}
        style={{
          textAlign: "center",
          marginTop: 28,
          position: "relative",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: 1,
          }}
        >
          ИЗУЧАЙТЕ&nbsp;&nbsp;•&nbsp;&nbsp;
          РАЗВИВАЙТЕСЬ&nbsp;&nbsp;•&nbsp;&nbsp; ДОСТИГАЙТЕ
        </span>
      </motion.div>
    </div>
  );
};
