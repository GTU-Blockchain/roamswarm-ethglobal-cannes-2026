// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IUserPOIRegistry {
    function getUserPOICount(address user) external view returns (uint256);
}

/// @title RoamPoints
/// @notice Non-transferable ERC-20; accrues +10 pts per owned POI per day.
///         500 pts = 1 free unlock (~0.5 USDC).
contract RoamPoints is ERC20 {
    uint256 public constant POINTS_PER_POI_PER_DAY = 10 * 10 ** 18;
    uint256 public constant UNLOCK_THRESHOLD = 500 * 10 ** 18;
    uint256 public constant CLAIM_INTERVAL = 1 days;

    address public immutable poiRegistry;
    address public owner;

    /// @notice Addresses that can call mint() or burn() (e.g. PointsRedeemer, CityBadgeNFT)
    mapping(address => bool) public minters;
    mapping(address => bool) public burners;

    mapping(address => uint256) public lastClaimed;

    event PointsClaimed(address indexed user, uint256 amount);
    event MinterSet(address indexed account, bool status);
    event BurnerSet(address indexed account, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "ROAM: not owner");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "ROAM: not a minter");
        _;
    }

    modifier onlyBurner() {
        require(burners[msg.sender], "ROAM: not a burner");
        _;
    }

    constructor(address _poiRegistry) ERC20("Roam Points", "ROAM") {
        poiRegistry = _poiRegistry;
        owner = msg.sender;
    }

    // ─── Non-transferable ───────────────────────────────────────────────────

    function transfer(address, uint256) public pure override returns (bool) {
        revert("ROAM: non-transferable");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override returns (bool) {
        revert("ROAM: non-transferable");
    }

    // ─── Daily Accrual ──────────────────────────────────────────────────────

    /// @notice Claim accumulated daily points based on owned POI count.
    ///         Can only be called once per CLAIM_INTERVAL (24h) per user.
    function claimDailyPoints() external {
        uint256 last = lastClaimed[msg.sender];
        uint256 amount;
        uint256 ownedCount;

        // First-ever claim: mint 1 interval and start the clock
        if (last == 0) {
            ownedCount = IUserPOIRegistry(poiRegistry).getUserPOICount(
                msg.sender
            );
            require(ownedCount > 0, "ROAM: no owned POIs");
            amount = ownedCount * POINTS_PER_POI_PER_DAY;
            lastClaimed[msg.sender] = block.timestamp;
            _mint(msg.sender, amount);
            emit PointsClaimed(msg.sender, amount);
            return;
        }

        uint256 elapsed = block.timestamp - last;
        require(elapsed >= CLAIM_INTERVAL, "ROAM: claim too soon");

        ownedCount = IUserPOIRegistry(poiRegistry).getUserPOICount(msg.sender);
        require(ownedCount > 0, "ROAM: no owned POIs");

        // Credit proportional to full intervals elapsed (catch-up safe)
        uint256 intervals = elapsed / CLAIM_INTERVAL;
        amount = intervals * ownedCount * POINTS_PER_POI_PER_DAY;

        lastClaimed[msg.sender] = block.timestamp;
        _mint(msg.sender, amount);

        emit PointsClaimed(msg.sender, amount);
    }

    /// @notice Returns how many points a user can claim right now (without reverting).
    function pendingPoints(address user) external view returns (uint256) {
        uint256 last = lastClaimed[user];
        uint256 ownedCount = IUserPOIRegistry(poiRegistry).getUserPOICount(
            user
        );
        if (ownedCount == 0) return 0;

        // First-ever claim: show 1 interval worth
        if (last == 0) return ownedCount * POINTS_PER_POI_PER_DAY;

        uint256 elapsed = block.timestamp - last;
        if (elapsed < CLAIM_INTERVAL) return 0;
        uint256 intervals = elapsed / CLAIM_INTERVAL;
        return intervals * ownedCount * POINTS_PER_POI_PER_DAY;
    }

    // ─── Privileged mint / burn (for other system contracts) ────────────────

    /// @notice Mint points to an address — callable only by authorized minters (e.g. CityBadgeNFT)
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    /// @notice Burn points from an address — callable only by authorized burners (e.g. PointsRedeemer)
    function burn(address from, uint256 amount) external onlyBurner {
        _burn(from, amount);
    }

    // ─── Access control ─────────────────────────────────────────────────────

    function setMinter(address account, bool status) external onlyOwner {
        minters[account] = status;
        emit MinterSet(account, status);
    }

    function setBurner(address account, bool status) external onlyOwner {
        burners[account] = status;
        emit BurnerSet(account, status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ROAM: zero address");
        owner = newOwner;
    }
}
