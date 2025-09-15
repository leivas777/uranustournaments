

//React Bootstrap
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

const AdminNavbar = ({ setActiveComponent }) => {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => setActiveComponent("data")}>Dados</Nav.Link>
            <NavDropdown title="Torneios">
              <NavDropdown.Item onClick={() => setActiveComponent("createTournament")}>Criar Torneio</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item>Gerenciar Torneios</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown title="Meus Torneios">
                <NavDropdown.Item>Finalizados</NavDropdown.Item>
                <NavDropdown.Item>Em Andamento</NavDropdown.Item>
                <NavDropdown.Item>Futuros</NavDropdown.Item>
              </NavDropdown>
            </NavDropdown>

            <NavDropdown title="Rankings">
              <NavDropdown.Item onClick={() => setActiveComponent('createRanking')}>Criar Ranking</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item>Gerenciar Ranking</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown title="Meus Ranking">
                <NavDropdown.Item>Finalizados</NavDropdown.Item>
                <NavDropdown.Item>Em Andamento</NavDropdown.Item>
                <NavDropdown.Item>Futuros</NavDropdown.Item>
              </NavDropdown>
            </NavDropdown>
            <NavDropdown title="Supers">
              <NavDropdown.Item onClick={() => setActiveComponent('createSuper')}>Criar Super</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item>Gerenciar Supers</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown title="Meus Supers">
                <NavDropdown.Item>Finalizados</NavDropdown.Item>
                <NavDropdown.Item>Em Andamento</NavDropdown.Item>
                <NavDropdown.Item>Futuros</NavDropdown.Item>
              </NavDropdown>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;
