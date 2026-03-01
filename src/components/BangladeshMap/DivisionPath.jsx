import { useTranslation } from "react-i18next";

export const DivisionPath = ({
  division,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const { t } = useTranslation();
  const getOpacity = () => {
    if (isSelected) return 1;
    if (isHovered) return 0.85;
    return 1;
  };

  return (
    <path
      d={division.path}
      fill={division.color}
      stroke="hsl(45, 7%, 13%)"
      strokeWidth={isSelected || isHovered ? 1.5 : 1}
      className="transition-duration-200 cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        opacity: getOpacity(),
        filter: isSelected
          ? "brightness(1.50)"
          : isHovered
            ? "brightness(1.50)"
            : "none",
      }}
    >
      <title>{t(`division_${division.id}`)}</title>
    </path>
  );
};
