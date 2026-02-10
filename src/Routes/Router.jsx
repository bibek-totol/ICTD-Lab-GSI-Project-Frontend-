import { createBrowserRouter } from "react-router";
import RootLayout from "../layout/RootLayout";
import ErrorPage from "../components/ErrorPage/ErrorPage";
import Home from "../Pages/Home/Home/Home";
import AllNotice from "../Pages/AllNotice/AllNotice";
import Lab from "../Pages/Dashboard/lab/Lab";
import LabDetails from "../Pages/LabDetails/LabDetails";
import Login from "../Pages/login/Login";
import PrivetRoute from "./PrivetRoute";
import DashboardHome from "../Pages/Dashboard/DashboardHome/DashboardHome";
import DashboardLayout from "../layout/DashboardLayout";

import Profile from "../Pages/Dashboard/Profile/Profile";
import Traning from "../Pages/Dashboard/Traning/Traning";
import LabsUnderControl from "../Pages/Dashboard/LabsUnderControls/LabsUnderControl";
import Complaints from "../Pages/Dashboard/Complaints/Complaints";
import ChangePassWord from "../Pages/Dashboard/ChangePassword/ChangePassWord";
import LabsUpdate from "../Pages/Dashboard/LabsUnderControls/LabsControl/LabsUpdate/LabsUpdate";
import FilesComplaints from "../Pages/Dashboard/LabsUnderControls/LabsControl/FilesComplaints/FilesComplaints";
import TraningUpdate from "../Pages/Dashboard/Traning/TraningUpdate/TraningUpdate";
import SendReport from "../Pages/Dashboard/SendReport/SendReport";
import SOFLabs from "../Pages/SOFLabs/SOFLabs";
import AddUser from "../Pages/Dashboard/user_control/add-user/AddUser";
import ICTDLabs from "../Pages/Dashboard/LabsUnderControls/ICTDLabs/ICTDLabs";
import ICTDLUpdate from "../Pages/Dashboard/LabsUnderControls/ICTDLabs/ICTDLUpdate/ICTDLUpdate";
import ManageUser from "../Pages/Dashboard/user_control/manege_user/ManageUser";
const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "labs",
        Component: Lab,
      },
      {
        path: "all-notice",
        Component: AllNotice,
      },

      {
        path: "labdetails",
        Component: LabDetails,
      },
      {
        path: "soflabs",
        Component: SOFLabs,
      },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: (
          <PrivetRoute>
            <DashboardHome />
          </PrivetRoute>
        ),
      },

      {
        path: "profile",
        Component: Profile,
      },
      {
        path: "traning",
        Component: Traning,
      },
      {
        path: "labsUnderControl",
        Component: LabsUnderControl,
      },
      {
        path: "complaints",
        Component: Complaints,
      },
      {
        path: "changePassword",
        Component: ChangePassWord,
      },
      {
        path: "labsUpdate/:id?",
        Component: LabsUpdate,
      },
      {
        path: "filesComplaints/:id?",
        Component: FilesComplaints,
      },
      {
        path: "trainingUpdate",
        Component: TraningUpdate,
      },
      {
        path: "sendReport",
        Component: SendReport,
      },
      {
        path: "ictdLabs",
        Component: ICTDLabs,
      },
      {
        path: "ictdLabsUpdate/:id",
        Component: ICTDLUpdate,
      },
      {
        path: "add-user",
        Component: AddUser,
      },

      {
        path: "manage-user",
        Component: ManageUser,
      }
    ],
  },
]);

export default router;
