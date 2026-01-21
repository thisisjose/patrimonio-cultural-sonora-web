import { Outlet, Link } from "react-router-dom";

function MainLayout() {
  return (
    <div>
      <nav>
        <Link to="/">Información</Link>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
