import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Loader2, ArrowLeft, Package, List } from "lucide-react";
import { FaRegTrashCan } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetGoodByIdMutation,
  useUpdateGoodMutation,
} from "@/features/api/Goods/goodsApi";

const UpdateGoods = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const goodId = location.state?.goodId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState([""]);

  const [getGoodById, { isLoading: loadingGood }] = useGetGoodByIdMutation();
  const [updateGood, { isLoading, isSuccess, isError, error, data }] =
    useUpdateGoodMutation();

  console.log(data);

  useEffect(() => {
    if (goodId) {
      getGoodById(goodId).then(({ data }) => {
        if (data?.success) {
          const good = data.good;
          setName(good.name || "");
          setDescription(good.description || "");
          setItems(good.items?.length ? good.items : [""]);
        } else {
          toast.error("Failed to load good data");
          navigate("/admin/goods");
        }
      });
    }
  }, [goodId]);

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
    if (!name.trim() || items.some((f) => !f.trim())) {
      toast.error("Name and all items are required");
      return;
    }

    await updateGood({
      id: goodId,
      name: name.trim(),
      description: description.trim(),
      items: items.map((f) => f.trim().toLowerCase()),
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Good updated successfully");
      navigate("/admin/goods");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to update good");
    }
  }, [isSuccess, isError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/goods")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Goods
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Package className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Good
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Edit good name, description and its items
              </p>
            </div>
          </div>
        </div>

        {loadingGood ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Good Name *
                  </Label>
                  <Input
                    placeholder="e.g., Electronics, Clothing, Food Items"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </Label>
                  <Input
                    placeholder="e.g., Electronic devices and accessories"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <List className="w-5 h-5" />
                Item Types
              </h3>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="e.g., Smartphones, Laptops, Tablets"
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => removeItem(index)}
                      >
                        <FaRegTrashCan className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="mt-4 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] border-[#FFD249]/30"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Item Type
                </Button>
              </div>
            </Card>
          </div>
        )}
    
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/goods")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            disabled={isLoading} 
            onClick={handleSubmit}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Good"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateGoods;
