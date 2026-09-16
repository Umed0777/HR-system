import { useEffect, useState } from "react";
import { Typography } from "antd";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import active from '../assets/active.png';
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

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");

      if (userStr) {
        const userObj = JSON.parse(userStr);

        setUserName(
          userObj.userName ||
            userObj.name ||
            userObj.login ||
            "Пользователь"
        );
      }
    } catch (e) {
      console.error(
        "Ошибка чтения данных пользователя:",
        e
      );
    }
  }, []);

  const handleMouseMove = (event) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      event.clientX -
      (rect.left + rect.width / 2);

    const y =
      event.clientY -
      (rect.top + rect.height / 2);

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
        padding: "30px 20px 50px",
        overflow: "hidden",
        position: "relative",
      }}
    >

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
        }}
      >
        <Title
          level={1}
          style={{
            margin: 0,
            fontSize:
              "clamp(34px, 5vw, 60px)",
            fontWeight: 800,
            background:
              "linear-gradient(90deg, #ef4444, #ec4899, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:
              "transparent",
            backgroundClip: "text",
          }}
        >
          Добро пожаловать,
        </Title>

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.3,
            duration: 0.7,
            type: "spring",
          }}
        >
          <Title
            level={1}
            style={{
              margin: "5px 0 0",
              fontSize:
                "clamp(38px, 5vw, 50px)",
              fontWeight: 900,
              color: "#ef4444",
            }}
          >
            {userName}!
          </Title>
        </motion.div>
      </motion.div>


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
          delay: 0.5,
          duration: 0.7,
        }}
        style={{
          textAlign: "center",
          marginTop: 5,
        }}
      >
        <Text
          style={{
            fontSize:
              "clamp(20px, 3vw, 30px)",
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          В базу знаний
        </Text>
      </motion.div>

      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 15,
          marginBottom: 25,
        }}
      >
        <span
          style={{
            fontSize: 35,
            color: "#ef4444",
            fontWeight: 700,
          }}
        >
        </span>
      </motion.div>
      <motion.div
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          delay: 0.8,
          duration: 1,
        }}
        style={{
          perspective: 1200,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <motion.div
          style={{
            rotateX: smoothRotateX,
            rotateY: smoothRotateY,
            width: "100%",
            maxWidth: 1200,
          }}
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: "100%",
              overflow: "hidden",
              borderRadius: 25,
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.12)",
            }}
          >
            <img
              src={active}
              alt="База знаний"
              style={{
                display: "block",
                width: "100%",
                height: "600px",
                objectFit: "contain",
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};