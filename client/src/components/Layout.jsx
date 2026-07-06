import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import styled from "@emotion/styled";
import { theme } from "../utils/utils";
import { Menu as MenuIcon, ChevronLeft } from "lucide-react";
import AppbrodaLogo from "../assets/AppbrodaIcon";

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: ${theme.background};
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ collapsed }) =>
    collapsed ? "center" : "space-between"};
  padding: ${({ collapsed }) => (collapsed ? "24px 0" : "24px 20px")};
  color: ${theme.textMain};
  border-bottom: 1px solid ${theme.border};
  margin-bottom: 16px;
  transition: padding 0.3s ease;
`;

const BrandContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${theme.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background-color: ${theme.primaryLight};
    color: ${theme.primary};
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 40px;
  overflow-y: auto;
`;

export default function Layout({ navItems = [] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <LayoutContainer>
      <Sidebar
        collapsed={isCollapsed}
        backgroundColor={theme.sidebarBg}
        rootStyles={{ borderRight: `1px solid ${theme.border}` }}
      >
        <SidebarHeader collapsed={isCollapsed}>
          {!isCollapsed ? (
            <>
              <BrandContainer>
                <AppbrodaLogo size={24} />
                IDR by Appbroda
              </BrandContainer>
              <ToggleButton onClick={() => setIsCollapsed(true)}>
                <ChevronLeft size={20} />
              </ToggleButton>
            </>
          ) : (
            <ToggleButton onClick={() => setIsCollapsed(false)}>
              <MenuIcon size={22} />
            </ToggleButton>
          )}
        </SidebarHeader>
        <Menu
          menuItemStyles={{
            button: ({ active }) => ({
              backgroundColor: active ? theme.primaryLight : undefined,
              color: active ? theme.primary : theme.textMuted,
              fontWeight: active ? 600 : 500,
              margin: "4px 12px",
              borderRadius: "8px",
              padding: "0 12px",

              "&:hover": {
                backgroundColor: active ? theme.primaryLight : "#f9fafb",
                color: active ? theme.primary : theme.textMain,
              },
            }),
            icon: ({ active }) => ({
              color: active ? theme.primary : theme.textMuted,
            }),
          }}
        >
          {navItems.map((item) => (
            <MenuItem
              key={item.path}
              icon={item.icon}
              component={<Link to={item.path} />}
              active={location.pathname === item.path}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Sidebar>

      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
}
