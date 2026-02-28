import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "../layout/RootLayout";
import ErrorPage from "../components/ErrorPage/ErrorPage";
import Home from "../Pages/Home/Home/Home";
import AllNotice from "../Pages/AllNotice/AllNotice";
import Lab from "../Pages/Dashboard/lab/Lab";
import LabDetails from "../Pages/LabDetails/LabDetails";
import Login from "../Pages/login/Login";
import PrivetRoute from "./PrivetRoute";
import SuperAdminRoute from "./SuperAdminRoute";
import PublicRoute from "./PublicRoute";
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
import ManageLabAdmin from "../Pages/Dashboard/user_control/manage_lab_admin/ManageLabAdmin";

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
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
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
        element: <PrivetRoute><Profile /></PrivetRoute>,
      },
      {
        path: "traning",
        element: <PrivetRoute><Traning /></PrivetRoute>,
      },
      {
        path: "labsUnderControl",
        element: <PrivetRoute><LabsUnderControl /></PrivetRoute>,
      },
      {
        path: "complaints",
        element: <PrivetRoute><Complaints /></PrivetRoute>,
      },
      {
        path: "changePassword",
        element: <PrivetRoute><ChangePassWord /></PrivetRoute>,
      },
      {
        path: "labsUpdate/:id?",
        element: <PrivetRoute><LabsUpdate /></PrivetRoute>,
      },
      {
        path: "filesComplaints/:id?",
        element: <PrivetRoute><FilesComplaints /></PrivetRoute>,
      },
      {
        path: "trainingUpdate",
        element: <PrivetRoute><TraningUpdate /></PrivetRoute>,
      },
      {
        path: "sendReport",
        element: <PrivetRoute><SendReport /></PrivetRoute>,
      },
      {
        path: "ictdLabs",
        element: <PrivetRoute><ICTDLabs /></PrivetRoute>,
      },
      {
        path: "ictdLabsUpdate/:id",
        element: <PrivetRoute><ICTDLUpdate /></PrivetRoute>,
      },
      // SuperAdmin-only routes
      {
        path: "add-user",
        element: (
          <SuperAdminRoute>
            <AddUser />
          </SuperAdminRoute>
        ),
      },
      {
        path: "manage-user",
        element: (
          <SuperAdminRoute>
            <ManageUser />
          </SuperAdminRoute>
        ),
      },
      {
        path: "manage-lab-admin",
        element: (
          <SuperAdminRoute>
            <ManageLabAdmin />
          </SuperAdminRoute>
        ),
      },
    ],
  },
]);

export default router;
