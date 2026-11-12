import { Layout, Typography } from "antd";
import { SealCheck } from "@phosphor-icons/react";

const { Footer } = Layout;
const { Text } = Typography;

const ModeratorFooter = () => {
  return (
    <Footer className="moderator-footer">
      <div className="moderator-footer-inner">
        <div className="moderator-footer-brand">
          <SealCheck className="moderator-footer-icon" />
          <Text className="moderator-footer-text">SecondSafe Moderation</Text>
        </div>
        <Text className="moderator-footer-divider">|</Text>
        <Text className="moderator-footer-text">Trung tâm kiểm duyệt</Text>
        <Text className="moderator-footer-divider">|</Text>
        <Text className="moderator-footer-text">&copy; {new Date().getFullYear()}</Text>
      </div>
    </Footer>
  );
};

export default ModeratorFooter;
