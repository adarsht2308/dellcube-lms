import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaRegTrashCan } from "react-icons/fa6";
import { useCreateGoodMutation } from "@/features/api/Goods/goodsApi.js";

const CreateGoods = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState([""]);

  const [createGood, { isLoading, isSuccess, isError, error, data }] =
    useCreateGoodMutation();

  const handleItemChange = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, ""]);
  };

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim() || items.some((item) => !item.trim())) {
      toast.error("Name and all item fields are required");
      return;
    }

    await createGood({
      name: name.trim(),
      description: description.trim(),
      items: items.map((item) => item.trim()),
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Good created successfully");
      navigate("/admin/goods");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create good");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Create Good</h2>
      <p className="text-sm mb-4 text-gray-500">
        Define a good and its associated item types.
      </p>

      <div className="grid gap-4">
        <div>
          <Label>Good Name</Label>
          <Input
            placeholder="Enter good name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label>Description (Optional)</Label>
          <Input
            placeholder="Enter good description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Item Types</Label>
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Enter item type"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
              />
              {items.length > 1 && (
                <Button
                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200"
                  onClick={() => removeItem(index)}
                >
                  <FaRegTrashCan />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="mt-2 w-fit"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/goods")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Good"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateGoods;
