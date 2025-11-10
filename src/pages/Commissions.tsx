import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit3, Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Commissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bailleurs, setBailleurs] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);
  const [selectedContrat, setSelectedContrat] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    bailleur_id: "",
    contrat_id: "",
    locataire: "",
    montant: "",
    date_perception: new Date().toISOString().split("T")[0],
    description: "",
  });

  // Charger bailleurs, contrats et commissions
  useEffect(() => {
    fetchCommissions();
    fetchBailleurs();
    fetchContrats();
  }, []);

  async function fetchBailleurs() {
    const { data, error } = await supabase.from("bailleurs").select("id, nom_complet");
    if (!error && data) setBailleurs(data);
  }

  async function fetchContrats() {
    const { data, error } = await supabase
      .from("contrats")
      .select("id, code_contrat, locataire_nom, bailleur_id");
    if (!error && data) setContrats(data);
  }

  async function fetchCommissions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("commissions")
      .select("id, montant, date_perception, description, locataire, bailleur_id, contrat_id, bailleurs(nom_complet), contrats(code_contrat)")
      .order("date_perception", { ascending: false });
    if (!error && data) setCommissions(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-remplir le locataire quand on choisit un contrat
    if (name === "contrat_id") {
      const contrat = contrats.find((c) => c.id === value);
      setSelectedContrat(contrat);
      setFormData((prev) => ({
        ...prev,
        contrat_id: value,
        locataire: contrat ? contrat.locataire_nom : "",
        bailleur_id: contrat ? contrat.bailleur_id : "",
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("commissions").insert([formData]);
    if (error) console.error(error);
    else {
      await fetchCommissions();
      setShowForm(false);
      setFormData({
        bailleur_id: "",
        contrat_id: "",
        locataire: "",
        montant: "",
        date_perception: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette commission ?")) return;
    await supabase.from("commissions").delete().eq("id", id);
    fetchCommissions();
  }

  const filtered = commissions.filter((c) =>
    c.bailleurs?.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
    c.locataire?.toLowerCase().includes(search.toLowerCase()) ||
    c.contrats?.code_contrat?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="text-blue-500" /> Commissions de l’agence
        </h1>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={18} /> Nouvelle Commission
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 shadow-md border border-gray-200">
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Bailleur</Label>
                <select
                  name="bailleur_id"
                  value={formData.bailleur_id}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {bailleurs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom_complet}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Contrat lié</Label>
                <select
                  name="contrat_id"
                  value={formData.contrat_id}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {contrats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code_contrat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Locataire</Label>
                <Input
                  name="locataire"
                  value={formData.locataire}
                  onChange={handleChange}
                  placeholder="Nom du locataire"
                  readOnly
                />
              </div>

              <div>
                <Label>Montant</Label>
                <Input
                  type="number"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  placeholder="Montant de la commission"
                  required
                />
              </div>

              <div>
                <Label>Date de perception</Label>
                <Input
                  type="date"
                  name="date_perception"
                  value={formData.date_perception}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Détails ou conditions particulières..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Rechercher par bailleur, contrat ou locataire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} /> Exporter Excel
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Bailleur</th>
              <th className="p-2 border">Locataire</th>
              <th className="p-2 border">Contrat</th>
              <th className="p-2 border">Montant</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="text-sm text-gray-700">
                <td className="p-2 border">{format(new Date(c.date_perception), "dd/MM/yyyy")}</td>
                <td className="p-2 border">{c.bailleurs?.nom_complet || "—"}</td>
                <td className="p-2 border">{c.locataire}</td>
                <td className="p-2 border">{c.contrats?.code_contrat}</td>
                <td className="p-2 border font-semibold text-green-600">{Number(c.montant).toLocaleString()} FCFA</td>
                <td className="p-2 border">{c.description || "—"}</td>
                <td className="p-2 border flex gap-2 justify-center">
                  <Button variant="outline" size="sm">
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Aucune commission enregistrée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
