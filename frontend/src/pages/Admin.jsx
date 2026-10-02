import { useEffect, useState, useMemo } from "react";
import api from "../services/api";

export default function Admin() {
  const [tab, setTab] = useState("overview"); // overview, bookings, packages, destinations, users
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ text: "", type: "success" });

  // Search states
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [packageSearch, setPackageSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modals
  const [pkgModal, setPkgModal] = useState({ open: false, isEdit: false, data: null });
  const [destModal, setDestModal] = useState({ open: false, isEdit: false, data: null });

  // Package Form State
  const [pkgForm, setPkgForm] = useState({
    title: "",
    destination: "",
    description: "",
    duration: 5,
    price: 1500,
    image: "",
    inclusions: "",
    available: true,
  });

  // Destination Form State
  const [destForm, setDestForm] = useState({
    name: "",
    country: "",
    description: "",
    image: "",
    bestTime: "",
    featured: false,
  });

  function showNotify(text, type = "success") {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: "", type: "" }), 4000);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [bRes, pRes, dRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/packages"),
        api.get("/destinations"),
      ]);
      setBookings(bRes.data || []);
      setPackages(pRes.data || []);
      setDestinations(dRes.data || []);

      // Try fetching users (admin only)
      try {
        const uRes = await api.get("/auth/users");
        setUsers(uRes.data || []);
      } catch (err) {
        console.warn("Could not fetch users list:", err.message);
      }
    } catch (err) {
      showNotify(err.response?.data?.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ─── Booking Actions ───
  async function updateBookingStatus(id, newStatus) {
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      showNotify(`Booking marked as ${newStatus}`);
      const res = await api.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      showNotify(err.response?.data?.message || "Failed to update booking", "error");
    }
  }

  // ─── Package Actions ───
  function openAddPackage() {
    setPkgForm({
      title: "",
      destination: destinations[0]?._id || "",
      description: "",
      duration: 5,
      price: 1500,
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      inclusions: "5-Star Accommodation, Daily Breakfast, Guided Tours, Airport Transfers",
      available: true,
    });
    setPkgModal({ open: true, isEdit: false, data: null });
  }

  function openEditPackage(pkg) {
    setPkgForm({
      title: pkg.title,
      destination: pkg.destination?._id || pkg.destination || destinations[0]?._id || "",
      description: pkg.description,
      duration: pkg.duration,
      price: pkg.price,
      image: pkg.image || "",
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join(", ") : "",
      available: pkg.available ?? true,
    });
    setPkgModal({ open: true, isEdit: true, data: pkg });
  }

  async function handleSavePackage(e) {
    e.preventDefault();
    const payload = {
      ...pkgForm,
      duration: Number(pkgForm.duration),
      price: Number(pkgForm.price),
      inclusions: pkgForm.inclusions
        ? pkgForm.inclusions.split(",").map(i => i.trim()).filter(Boolean)
        : [],
    };

    try {
      if (pkgModal.isEdit) {
        await api.put(`/packages/${pkgModal.data._id}`, payload);
        showNotify("Package updated successfully!");
      } else {
        await api.post("/packages", payload);
        showNotify("New package published!");
      }
      setPkgModal({ open: false, isEdit: false, data: null });
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (err) {
      showNotify(err.response?.data?.message || "Error saving package", "error");
    }
  }

  async function handleDeletePackage(id) {
    if (!window.confirm("Are you sure you want to delete this travel package?")) return;
    try {
      await api.delete(`/packages/${id}`);
      showNotify("Package removed successfully");
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (err) {
      showNotify(err.response?.data?.message || "Failed to delete package", "error");
    }
  }

  async function togglePackageAvailable(pkg) {
    try {
      await api.put(`/packages/${pkg._id}`, { available: !pkg.available });
      const res = await api.get("/packages");
      setPackages(res.data);
      showNotify(`Package is now ${!pkg.available ? "Active" : "Archived"}`);
    } catch (err) {
      showNotify("Could not toggle availability", "error");
    }
  }

  // ─── Destination Actions ───
  function openAddDest() {
    setDestForm({
      name: "",
      country: "",
      description: "",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      bestTime: "Apr - Oct",
      featured: true,
    });
    setDestModal({ open: true, isEdit: false, data: null });
  }

  function openEditDest(dest) {
    setDestForm({
      name: dest.name,
      country: dest.country,
      description: dest.description,
      image: dest.image || "",
      bestTime: dest.bestTime || "",
      featured: dest.featured ?? false,
    });
    setDestModal({ open: true, isEdit: true, data: dest });
  }

  async function handleSaveDest(e) {
    e.preventDefault();
    try {
      if (destModal.isEdit) {
        await api.put(`/destinations/${destModal.data._id}`, destForm);
        showNotify("Destination updated successfully!");
      } else {
        await api.post("/destinations", destForm);
        showNotify("New destination added!");
      }
      setDestModal({ open: false, isEdit: false, data: null });
      const res = await api.get("/destinations");
      setDestinations(res.data);
    } catch (err) {
      showNotify(err.response?.data?.message || "Error saving destination", "error");
    }
  }

  async function handleDeleteDest(id) {
    if (!window.confirm("Are you sure you want to delete this destination? Packages linked to it may be affected.")) return;
    try {
      await api.delete(`/destinations/${id}`);
      showNotify("Destination deleted");
      const res = await api.get("/destinations");
      setDestinations(res.data);
    } catch (err) {
      showNotify(err.response?.data?.message || "Failed to delete destination", "error");
    }
  }

  async function toggleDestFeatured(dest) {
    try {
      await api.put(`/destinations/${dest._id}`, { featured: !dest.featured });
      const res = await api.get("/destinations");
      setDestinations(res.data);
      showNotify(`Destination featured status: ${!dest.featured ? "Featured" : "Regular"}`);
    } catch (err) {
      showNotify("Could not toggle featured status", "error");
    }
  }

  // ─── Analytics / Overview Computations ───
  const totalRevenue = useMemo(() => {
    return bookings
      .filter(b => b.status === "confirmed")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status === "pending");
  }, [bookings]);

  // ─── Filtered Lists ───
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (bookingFilter !== "all" && b.status !== bookingFilter) return false;
      if (!bookingSearch) return true;
      const term = bookingSearch.toLowerCase();
      const userMatch = b.user?.name?.toLowerCase().includes(term) || b.user?.email?.toLowerCase().includes(term);
      const pkgMatch = b.package?.title?.toLowerCase().includes(term);
      return userMatch || pkgMatch;
    });
  }, [bookings, bookingFilter, bookingSearch]);

  const filteredPackages = useMemo(() => {
    if (!packageSearch) return packages;
    const term = packageSearch.toLowerCase();
    return packages.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.destination?.name?.toLowerCase().includes(term) ||
      p.destination?.country?.toLowerCase().includes(term)
    );
  }, [packages, packageSearch]);

  const filteredDestinations = useMemo(() => {
    if (!destSearch) return destinations;
    const term = destSearch.toLowerCase();
    return destinations.filter(d =>
      d.name.toLowerCase().includes(term) ||
      d.country.toLowerCase().includes(term)
    );
  }, [destinations, destSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const term = userSearch.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  return (
    <main className="admin-container">
      {/* Top Banner / Header */}
      <div className="admin-top-bar">
        <div>
          <span className="eyebrow">PORTAL ADMINISTRATION</span>
          <h1>TravelMate Operations Suite</h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: 15 }}>
            Manage bookings, publish travel packages, configure destinations, and review customers.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn outline small" onClick={loadAll}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification.text && (
        <div
          className={`animate-up ${notification.type === "error" ? "error" : "newsletter-success"}`}
          style={{ marginBottom: 24, padding: "14px 20px" }}
        >
          {notification.type === "error" ? "⚠️" : "✅"} {notification.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab-btn ${tab === "bookings" ? "active" : ""}`}
          onClick={() => setTab("bookings")}
        >
          📅 Bookings
          <span className="admin-tab-badge">{bookings.length}</span>
        </button>
        <button
          className={`admin-tab-btn ${tab === "packages" ? "active" : ""}`}
          onClick={() => setTab("packages")}
        >
          🧳 Packages
          <span className="admin-tab-badge">{packages.length}</span>
        </button>
        <button
          className={`admin-tab-btn ${tab === "destinations" ? "active" : ""}`}
          onClick={() => setTab("destinations")}
        >
          📍 Destinations
          <span className="admin-tab-badge">{destinations.length}</span>
        </button>
        <button
          className={`admin-tab-btn ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          👥 Users
          <span className="admin-tab-badge">{users.length}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
          <p>Loading administration data…</p>
        </div>
      ) : (
        <>
          {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
          {tab === "overview" && (
            <div>
              {/* Stat Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span className="admin-stat-icon">💰</span>
                  <span className="admin-stat-label">Confirmed Revenue</span>
                  <span className="admin-stat-value">₹{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-icon">📋</span>
                  <span className="admin-stat-label">Total Reservations</span>
                  <span className="admin-stat-value">{bookings.length}</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-icon">⏳</span>
                  <span className="admin-stat-label">Pending Approval</span>
                  <span className="admin-stat-value" style={{ color: pendingBookings.length ? "var(--gold)" : "inherit" }}>
                    {pendingBookings.length}
                  </span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-icon">🧳</span>
                  <span className="admin-stat-label">Active Packages</span>
                  <span className="admin-stat-value">{packages.filter(p => p.available).length}</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-icon">👥</span>
                  <span className="admin-stat-label">Registered Travellers</span>
                  <span className="admin-stat-value">{users.length}</span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 36, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>⚡ Quick Actions:</span>
                <button className="btn small" onClick={openAddPackage}>+ Create Travel Package</button>
                <button className="btn outline small" onClick={openAddDest}>+ Add Destination</button>
                {pendingBookings.length > 0 && (
                  <button className="btn gold small" onClick={() => { setTab("bookings"); setBookingFilter("pending"); }}>
                    Review {pendingBookings.length} Pending Booking(s)
                  </button>
                )}
              </div>

              {/* Recent Bookings List */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, margin: 0 }}>Recent Bookings</h3>
                  <button className="btn outline small" onClick={() => setTab("bookings")}>View All Bookings →</button>
                </div>
                {bookings.slice(0, 5).map(b => (
                  <div className="admin-item-card" key={b._id}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span className={`status ${b.status}`}>{b.status}</span>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>Ref #{b._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <h4 style={{ margin: "2px 0 4px", fontSize: 16 }}>{b.package?.title || "Custom Package"}</h4>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                        👤 {b.user?.name} ({b.user?.email}) · 📅 {new Date(b.travelDate).toLocaleDateString()} · 👥 {b.guests} guest(s)
                      </p>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <strong style={{ fontSize: 17, color: "var(--green)" }}>₹{b.totalAmount?.toLocaleString()}</strong>
                      {b.status === "pending" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn small" onClick={() => updateBookingStatus(b._id, "confirmed")}>Confirm</button>
                          <button className="btn danger small" onClick={() => updateBookingStatus(b._id, "cancelled")}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════ BOOKINGS TAB ══════════════════ */}
          {tab === "bookings" && (
            <div>
              <div className="admin-toolbar">
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", flex: 1 }}>
                  <input
                    className="search"
                    style={{ minWidth: 260 }}
                    placeholder="🔍 Search by customer or package..."
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                  />
                  <div className="chip-group">
                    {["all", "pending", "confirmed", "cancelled"].map(st => (
                      <button
                        key={st}
                        className={`chip ${bookingFilter === st ? "active" : ""}`}
                        onClick={() => setBookingFilter(st)}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                  Showing {filteredBookings.length} booking(s)
                </span>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No bookings found</h3>
                  <p>Try clearing filters or search terms.</p>
                </div>
              ) : (
                filteredBookings.map(b => (
                  <div className="admin-item-card" key={b._id}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                        <span className={`status ${b.status}`}>{b.status}</span>
                        <span className={`pay-status ${b.paymentStatus || "pending"}`}>
                          💳 {b.paymentStatus === "paid" ? "PAID" : b.paymentStatus === "refunded" ? "REFUNDED" : "UNPAID"}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                          ID: #{b._id.slice(-8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          Booked: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>{b.package?.title || "Travel Package"}</h3>
                      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14, color: "var(--muted)" }}>
                        <span>👤 <strong>{b.user?.name || "Customer"}</strong> ({b.user?.email || "No email"})</span>
                        <span>📅 Travel: <strong>{new Date(b.travelDate).toLocaleDateString()}</strong></span>
                        <span>👥 <strong>{b.guests}</strong> guest(s)</span>
                        {b.razorpayPaymentId && (
                          <span>⚡ Rzp ID: <code>{b.razorpayPaymentId}</code></span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--green)" }}>
                        ₹{b.totalAmount?.toLocaleString()}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {b.status !== "confirmed" && (
                          <button className="btn small" onClick={() => updateBookingStatus(b._id, "confirmed")}>
                            Confirm
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button className="btn danger small" onClick={() => updateBookingStatus(b._id, "cancelled")}>
                            Cancel
                          </button>
                        )}
                        {b.status !== "pending" && (
                          <button className="btn outline small" onClick={() => updateBookingStatus(b._id, "pending")}>
                            Mark Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══════════════════ PACKAGES TAB ══════════════════ */}
          {tab === "packages" && (
            <div>
              <div className="admin-toolbar">
                <input
                  className="search"
                  style={{ minWidth: 260 }}
                  placeholder="🔍 Search packages..."
                  value={packageSearch}
                  onChange={e => setPackageSearch(e.target.value)}
                />
                <button className="btn small" onClick={openAddPackage}>
                  + Add New Package
                </button>
              </div>

              {filteredPackages.map(p => (
                <div className="admin-item-card" key={p._id}>
                  <img
                    className="admin-thumb"
                    src={p.image || p.destination?.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80"}
                    alt={p.title}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span className={`status ${p.available ? "confirmed" : "cancelled"}`}>
                        {p.available ? "Active" : "Archived"}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>
                        📍 {p.destination?.name ? `${p.destination.name}, ${p.destination.country}` : "Unassigned"}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18 }}>{p.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 580, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.description}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>
                      ₹{p.price?.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>/ {p.duration} days</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn outline small" onClick={() => togglePackageAvailable(p)}>
                        {p.available ? "Archive" : "Activate"}
                      </button>
                      <button className="btn small" onClick={() => openEditPackage(p)}>
                        Edit
                      </button>
                      <button className="btn danger small" onClick={() => handleDeletePackage(p._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════ DESTINATIONS TAB ══════════════════ */}
          {tab === "destinations" && (
            <div>
              <div className="admin-toolbar">
                <input
                  className="search"
                  style={{ minWidth: 260 }}
                  placeholder="🔍 Search destinations..."
                  value={destSearch}
                  onChange={e => setDestSearch(e.target.value)}
                />
                <button className="btn small" onClick={openAddDest}>
                  + Add Destination
                </button>
              </div>

              {filteredDestinations.map(d => (
                <div className="admin-item-card" key={d._id}>
                  <img
                    className="admin-thumb"
                    src={d.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80"}
                    alt={d.name}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {d.featured && <span className="dest-tag" style={{ position: "static" }}>⭐ Featured</span>}
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>📍 {d.country}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>🗓️ Best Time: {d.bestTime || "All year"}</span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18 }}>{d.name}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 580, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn outline small" onClick={() => toggleDestFeatured(d)}>
                      {d.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button className="btn small" onClick={() => openEditDest(d)}>
                      Edit
                    </button>
                    <button className="btn danger small" onClick={() => handleDeleteDest(d._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════ USERS TAB ══════════════════ */}
          {tab === "users" && (
            <div>
              <div className="admin-toolbar">
                <input
                  className="search"
                  style={{ minWidth: 260 }}
                  placeholder="🔍 Search customers by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                  {filteredUsers.length} user(s) registered
                </span>
              </div>

              {filteredUsers.map(u => (
                <div className="admin-item-card" key={u._id}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--green-pale)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{u.name}</h4>
                      <span className={`status ${u.role === "admin" ? "confirmed" : "pending"}`} style={{ textTransform: "uppercase", fontSize: 11 }}>
                        {u.role}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                      ✉️ {u.email} · 🗓️ Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════ PACKAGE MODAL ══════════════════ */}
      {pkgModal.open && (
        <div className="admin-modal-overlay" onClick={() => setPkgModal({ open: false, isEdit: false, data: null })}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{pkgModal.isEdit ? "Edit Travel Package" : "Create Travel Package"}</h2>
            <form onSubmit={handleSavePackage}>
              <div className="admin-form-group">
                <label>Package Title *</label>
                <input
                  required
                  placeholder="e.g. Aegean Sunset & Caldera Cruise"
                  value={pkgForm.title}
                  onChange={e => setPkgForm({ ...pkgForm, title: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Destination *</label>
                  <select
                    required
                    value={pkgForm.destination}
                    onChange={e => setPkgForm({ ...pkgForm, destination: e.target.value })}
                  >
                    <option value="">Select Destination</option>
                    {destinations.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.country})</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Duration (days) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pkgForm.duration}
                    onChange={e => setPkgForm({ ...pkgForm, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pkgForm.price}
                    onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Status</label>
                  <select
                    value={pkgForm.available ? "true" : "false"}
                    onChange={e => setPkgForm({ ...pkgForm, available: e.target.value === "true" })}
                  >
                    <option value="true">Active & Bookable</option>
                    <option value="false">Archived / Draft</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={pkgForm.image}
                  onChange={e => setPkgForm({ ...pkgForm, image: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Description *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe the experience and key highlights..."
                  value={pkgForm.description}
                  onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Inclusions (comma-separated)</label>
                <input
                  placeholder="Luxury Hotel, Private Cruise, Champagne Breakfast, Airport Transfer"
                  value={pkgForm.inclusions}
                  onChange={e => setPkgForm({ ...pkgForm, inclusions: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <button type="button" className="btn outline small" onClick={() => setPkgModal({ open: false, isEdit: false, data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn small">
                  {pkgModal.isEdit ? "Update Package" : "Publish Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════ DESTINATION MODAL ══════════════════ */}
      {destModal.open && (
        <div className="admin-modal-overlay" onClick={() => setDestModal({ open: false, isEdit: false, data: null })}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{destModal.isEdit ? "Edit Destination" : "Add Destination"}</h2>
            <form onSubmit={handleSaveDest}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Destination Name *</label>
                  <input
                    required
                    placeholder="e.g. Kyoto"
                    value={destForm.name}
                    onChange={e => setDestForm({ ...destForm, name: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Country *</label>
                  <input
                    required
                    placeholder="e.g. Japan"
                    value={destForm.country}
                    onChange={e => setDestForm({ ...destForm, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Best Season to Visit</label>
                  <input
                    placeholder="e.g. Mar - May, Sep - Nov"
                    value={destForm.bestTime}
                    onChange={e => setDestForm({ ...destForm, bestTime: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Featured Destination</label>
                  <select
                    value={destForm.featured ? "true" : "false"}
                    onChange={e => setDestForm({ ...destForm, featured: e.target.value === "true" })}
                  >
                    <option value="true">Featured on Homepage</option>
                    <option value="false">Standard Listing</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={destForm.image}
                  onChange={e => setDestForm({ ...destForm, image: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Description *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Brief overview of the location and atmosphere..."
                  value={destForm.description}
                  onChange={e => setDestForm({ ...destForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <button type="button" className="btn outline small" onClick={() => setDestModal({ open: false, isEdit: false, data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn small">
                  {destModal.isEdit ? "Update Destination" : "Add Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
