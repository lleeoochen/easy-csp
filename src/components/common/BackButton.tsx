import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

type BackButtonProps = {
  to?: string;
  label?: string;
};

export const BackButton = ({ to, label = "Back" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
};
