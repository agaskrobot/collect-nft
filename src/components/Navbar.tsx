"use client";
import { useInitWallet, useWallet } from "../wallets/wallet-selector";
import { NetworkId } from "../config";

export const Navbar = () => {
  useInitWallet({ createAccessKeyFor: "", networkId: NetworkId });

  return <NavbarContainer />;
};

export const NavbarContainer = () => {
  const { signedAccountId, logOut, logIn } = useWallet();
  console.log(signedAccountId);
console.log(logIn)
  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        {/* <Link href="/" passHref legacyBehavior>
          <Image
            priority
            src={NearLogo}
            alt="NEAR"
            width="30"
            height="24"
            className="d-inline-block align-text-top"
          />
        </Link> */}
        <div className="navbar-nav pt-1">
          <button
            className="btn btn-secondary"
            onClick={signedAccountId ? () => logOut() : () => logIn()}
          >
            {signedAccountId ? `Logout ${signedAccountId}` : "Login"}
          </button>
        </div>
      </div>
    </nav>
  );
};
