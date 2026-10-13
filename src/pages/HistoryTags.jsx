import { Tag } from "antd";
import { ATTEMPT_STATUS, getStatusKey, getScoreTag } from "../utils/oneTimeHistory";

export const StatusTag = ({ needsGrading }) => {
  const s = ATTEMPT_STATUS[getStatusKey(needsGrading)];
  return <Tag color={s.color}>{s.label}</Tag>;
};

export const ScoreTag = ({ score }) => {
  const s = getScoreTag(score);
  return <Tag color={s.color}>{s.label}</Tag>;
};